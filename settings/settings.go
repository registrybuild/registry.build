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
	flagRegex    = regexp.MustCompile(`(?m)^\s*--([^\s]+)(?:\s\[-(.)\])?\s+(?:\((.+?); (.+?)\))?\s*((?:^\s\s\s\s.*?\n)+)`)
	tagsRegex    = regexp.MustCompile(`(?m)(^\s\s\s\s\s\sTags:(?:.*\n?)*)`)
)

func main() {
	flag.Parse()

	b, err := os.ReadFile("registry/github/bazelbuild/bazel/releases.json")
	if err != nil {
		panic(err)
	}

	var releases []Release
	json.Unmarshal(b, &releases)

	oldVersions := []string{
		"5.4.1",
		"5.4.0",
		"5.3.1",
		"5.3.0",
		"5.2.0",
		"5.1.1",
		"5.1.0",
		"5.0.0",
		"4.2.4",
		"4.2.3",
		"4.2.2",
		"4.2.1",
		"4.2.0",
		"4.1.0",
		"4.0.0",
		"3.7.0",
		"3.6.0",
		"3.5.1",
		"3.4.0",
		"3.3.0",
		"3.2.0",
		"3.1.0",
		"3.0.0",
		"2.2.0",
		"2.1.0",
		"2.0.0",
		"1.2.0",
		"1.1.0",
		"1.0.0",
		"0.29.1",
		"0.29.0",
		"0.28.0",
		"0.27.0",
		"0.26.0",
		"0.25.0",
		"0.24.0",
		"0.23.0",
		"0.22.0",
		"0.21.0",
		"0.20.0",
		"0.19.2",
		"0.19.1",
		"0.18.1",
		"0.17.2",
		"0.17.1",
	}

	for _, v := range oldVersions {
		extractFlagsForVersion(v)
	}

	for _, r := range releases {
		if r.Prerelease || r.Draft {
			continue
		}
		extractFlagsForVersion(r.TagName)
	}
}

func extractFlagsForVersion(bazelVersion string) {
	path := filepath.Join("flag/bazel", bazelVersion)
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		log.Printf("Skipping bazel version %s, directory already exists", bazelVersion)
		return
	}
	log.Printf("Extracting flags for Bazel version %s", bazelVersion)
	err := os.MkdirAll(filepath.Join(*outputPath, bazelVersion), 0777)
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
			if existingFlag, ok := flagMap[f.Name]; ok {
				f.Sources = append(existingFlag.Sources, c.Name)
			} else {
				f.Sources = append(f.Sources, c.Name)
			}
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
	cmd.Env = append(os.Environ(), "USE_BAZEL_VERSION="+bazelVersion, "BAZELISK_BASE_URL=https://github.com/bazelbuild/bazel/releases/download")
	cmd.Dir = filepath.Join(*outputPath, bazelVersion)
	var outbytes bytes.Buffer
	cmd.Stdout = &outbytes
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		panic(err)
	}

	outString := outbytes.String()

	filename := command
	if filename == "" {
		filename = "help"
	}

	outfile, err := os.Create(filepath.Join(*outputPath, bazelVersion, filename))
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
		f := Flag{
			Name:        strings.TrimPrefix(m[1], "[no]"),
			Short:       m[2],
			Type:        strings.TrimPrefix(strings.TrimPrefix(m[3], "an "), "a "),
			Default:     m[4],
			Description: strings.ReplaceAll(strings.TrimSpace(m[5]), "\n    ", ""),
			Tags:        []string{},
			Sources:     []string{},
		}

		t := tagsRegex.FindStringSubmatch(m[5])
		if len(t) > 0 {
			f.Tags = strings.Split(strings.TrimPrefix(strings.TrimSpace(t[1]), "Tags: "), ", ")
			f.Description = tagsRegex.ReplaceAllString(m[5], "")
		}

		flags = append(flags, f)
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
	Short       string   `json:"short"`
	Type        string   `json:"type"`
	Default     string   `json:"default"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
	Sources     []string `json:"sources"`
}

type Command struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Extra       bool   `json:"extra"`
}
