package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

var (
	outputPath   = flag.String("path", "data/settings", "output path")
	commandRegex = regexp.MustCompile(`(?m)^\s\s([^\s]+?)\s+(.+)$`)
	flagRegex    = regexp.MustCompile(`(?m)^\s*--([^\s]+)\s+\((.+?); (.+?)\)\s*((?:^\s\s\s\s[^\s].*?\n)+)((?:^\s\s\s\s\s\s[^\s].*?\n)+)?`)
)

func main() {
	flag.Parse()

	b, err := os.ReadFile("registry/github/bazelbuild/bazel/releases.json")
	if err != nil {
		panic(err)
	}

	var releases []Release
	json.Unmarshal(b, &releases)

	for _, r := range releases {
		if r.Prerelease || r.Draft {
			continue
		}
		// todo check if directory exists first
		extractFlagsForVersion(r.TagName)
	}
}

func extractFlagsForVersion(bazelVersion string) {
	log.Printf("Extracting flags for Bazel version %s", bazelVersion)
	err := os.MkdirAll(filepath.Join(*outputPath, bazelVersion), 0777)
	if err != nil {
		panic(err)
	}

	err = os.WriteFile(filepath.Join(*outputPath, bazelVersion, ".bazelversion"), []byte(bazelVersion), 0777)
	if err != nil {
		panic(err)
	}

	outString := runBazeliskCommand(bazelVersion, "")

	commands := []Command{}
	matches := commandRegex.FindAllStringSubmatch(outString, -1)
	for _, m := range matches {
		command := m[1]
		description := m[2]
		if command == "bazel" {
			parts := strings.Split(description, " ")
			extra := parts[len(parts)-1]
			if !strings.HasPrefix(extra, "<") {
				commands = append(commands, Command{
					Name:        extra,
					Description: "",
					Extra:       true,
				})
			}
			continue
		}
		commands = append(commands, Command{
			Name:        command,
			Description: description,
			Extra:       false,
		})
	}
	path := filepath.Join("flag/bazel", bazelVersion)
	err = os.MkdirAll(path, 0777)
	if err != nil {
		panic(err)
	}

	b, err := json.Marshal(commands)
	if err != nil {
		panic(err)
	}
	err = os.WriteFile(filepath.Join(path, "commands.json"), b, 0777)
	if err != nil {
		panic(err)
	}

	flagMap := map[string]Flag{}
	for _, c := range commands {
		output := runBazeliskCommand(bazelVersion, c.Name)
		flags := extractFlagsFromOutput(output)

		for _, f := range flags {
			flagMap[f.Name] = f
		}

		b, err := json.Marshal(flags)
		if err != nil {
			panic(err)
		}
		err = os.WriteFile(filepath.Join(path, c.Name+".json"), b, 0777)
		if err != nil {
			panic(err)
		}
	}

	allFlags := []Flag{}
	for _, v := range flagMap {
		allFlags = append(allFlags, v)
	}
	b, err = json.Marshal(allFlags)
	if err != nil {
		panic(err)
	}
	err = os.WriteFile(filepath.Join(path, "all.json"), b, 0777)
	if err != nil {
		panic(err)
	}
}

func runBazeliskCommand(bazelVersion, command string) string {
	args := []string{"help"}
	if command != "" {
		args = append(args, command)
		args = append(args, "--long")
	}

	log.Printf("Running command %+v on Bazel version %s", args, bazelVersion)

	cmd := exec.Command("bazelisk", args...)
	cmd.Dir = filepath.Join(*outputPath, bazelVersion)
	var outbytes bytes.Buffer
	cmd.Stdout = &outbytes

	err := cmd.Run()
	if err != nil {
		panic(err)
	}

	outString := outbytes.String()

	outfile, err := os.Create(filepath.Join(*outputPath, bazelVersion, strings.Join(args, "-")))
	if err != nil {
		panic(err)
	}
	defer outfile.Close()
	_, err = outfile.WriteString(outString)
	if err != nil {
		panic(err)
	}
	return outString
}

func extractFlagsFromOutput(output string) []Flag {
	// todo grab command description
	matches := flagRegex.FindAllStringSubmatch(output, -1)
	flags := []Flag{}
	for _, m := range matches {
		flags = append(flags, Flag{
			Name:        strings.TrimPrefix(m[1], "[no]"),
			Type:        strings.TrimPrefix(strings.TrimPrefix(m[2], "an "), "a "),
			Default:     strings.Trim(strings.TrimPrefix(m[3], "default: "), `"`),
			Description: strings.ReplaceAll(strings.TrimSpace(m[4]), "\n    ", ""),
			Tags:        strings.Split(strings.TrimPrefix(strings.TrimSpace(m[5]), "Tags: "), ", "),
		})
	}
	return flags
}

type Release struct {
	TagName    string `json:"tag_name"`
	Draft      bool   `json:"draft"`
	Prerelease bool   `json:"prerelease"`
}

type Flag struct {
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	Default     string   `json:"default"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

type Command struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Extra       bool   `json:"extra"`
}
