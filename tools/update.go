package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"

	rst "github.com/hhatto/gorst"
)

var md = goldmark.New(
	goldmark.WithExtensions(extension.GFM),
	goldmark.WithParserOptions(
		parser.WithAutoHeadingID(),
	),
	goldmark.WithRendererOptions(
	// html.WithHardWraps(),
	// html.WithXHTML(),
	),
)

func main() {
	err := clone("bazelbuild/bazel-central-registry", false)
	if err != nil {
		log.Printf("Error cloning %s", err)
	}

	modules, err := walk()
	if err != nil {
		log.Printf("Error walking %s", err)
	}

	additionalRepos := []string{
		"evertz/ev_rules_aws",
		"bazelbuild/rules_android",
		"bazelbuild/rules_android_ndk",
		"quittle/bazel_android_sdk_downloader",
		"lalten/rules_appimage",
		"bazelbuild/rules_apple",
		"line/bazel_rules_apple",
		"marcohu/rules_antlr",
		"mjbots/rules_mbed",
		"jmillikin/rules_bison",
		"zaucy/rules_blender",
		"calebfroese/rules_bosh",
		"Brightspace/rules_brotli",
		"bazelbuild/rules_cc",
		"nelhage/rules_boost",
		"hedronvision/bazel-make-cc-https-easy",
		"erenon/bazel_clang_tidy",
		"rnburn/rules_cc_module",
		"vertexwahn/rules_qt6",
		"bazelbuild/rules_dotnet",
		"Brightspace/rules_csharp",
		"simuons/rules_clojure",
		"bazelbuild/rules_closure",
		"bazelbuild/rules_postcss",
		"bazelbuild/rules_foreign_cc",
		"pinterest/PodToBUILD",
		"zegl/rules_codeowners",
		"bazelbuild/rules_d",
		"cbracken/rules_dart",
		"acqio/rules_databricks",
		"bazelbuild/rules_docker",
		"rmohr/rules_container_rpm",
		"filmil/bazel-ebook",
		"EdSchouten/rules_elm",
		"phst/rules_elisp",
		"ribrdb/rules_emscripten",
		"rabbitmq/rules_erlang",
		"jmillikin/rules_flex",
		"bazelbuild/rules_go",
		"ActiveState/rules_vendor",
		"jmhodges/bazel_gomock",
		"andyscott/rules_graal",
		"etsy/rules_grafana",
		"bazelbuild/rules_groovy",
		"bazelbuild/rules_gwt",
		"tweag/rules_haskell",
		"FormationAI/hazel",
		"google/cabal2bazel",
		"google/hrepl",
		"tmc/rules_helm",
		"masmovil/bazel-rules",
		"salesforce/bazoku",
		"tmc/rules_homebrew",
		"stackb/rules_hugo",
		"BryghtWords/rules_idris",
		"vertexwahn/rules_ispc",
		"bazelbuild/rules_java",
		"bazelbuild/tools_jvm_autodeps",
		"salesforce/bazel-java-builder-template",
		"fmeum/rules_jni",
		"bazel-contrib/rules_jvm",
		"jflex-de/bazel_rules",
		"bazelbuild/rules_kotlin",
		"buildfoundation/bazel_rules_detekt",
		"bazelbuild/rules_k8s",
		"acqio/rules_k8s_extension",
		"adobe/rules_gitops",
		"ProdriveTechnologies/bazel-latex",
		"vsco/bazel-toolchains",
		"grailbio/bazel-toolchain",
		"samolisov/bazel-llvm-bridge",
		"jmillikin/rules_m4",
		"kindlyops/rules_manifest",
		"johnynek/bazel-deps",
		"pubref/rules_maven",
		"bazelbuild/gmaven_rules",
		"square/bazel_maven_repository",
		"bazelbuild/rules_jvm_external",
		"menny/bazel-mvn-deps",
		"acqio/rules_microsoft_azure",
		"NativeScript/nativescript-dev-bazel",
		"tweag/rules_nixpkgs",
		"bazelbuild/rules_nodejs",
		"ecosia/bazel_rules_nodejs_contrib",
		"dropbox/rules_node",
		"pubref/rules_node",
		"zenclabs/bazel-javascript",
		"vistarmedia/rules_js",
		"thelgevold/rules_svelte",
		"aspect-build/rules_js",
		"aspect-build/rules_esbuild",
		"aspect-build/rules_terser",
		"aspect-build/rules_swc",
		"aspect-build/rules_ts",
		"aspect-build/rules_webpack",
		"aspect-build/rules_rollup",
		"aspect-build/rules_jest",
		"aspect-build/rules_jasmine",
		"aspect-build/rules_cypress",
		"jin/rules_ocaml",
		"obazl/rules_ocaml",
		"guymers/bazel_rules_container",
		"guymers/containers_by_bazel",
		"bazel-contrib/rules_oci",
		"meetup/rules_openapi",
		"bazelbuild/rules_pkg",
		"ericnorris/rules_nfpm",
		"ProdriveTechnologies/bazel-pandoc",
		"kburnik/php_codebase",
		"5h4d0w4rt/rules_prometheus",
		"rules-proto-grpc/rules_proto_grpc",
		"stackb/rules_proto",
		"bazelbuild/rules_proto",
		"bufbuild/rules_buf",
		"felixmulder/rules_purescript",
		"bazelbuild/rules_python",
		"benley/bazel_rules_pex",
		"georgeliaw/rules_wheel",
		"tuomasr/pazel",
		"zenreach/ramsay",
		"weisi/bazel_for_gcloud_python",
		"apt-itude/rules_pip",
		"tubular/rules_pygen",
		"TriggerMail/rules_pyz",
		"aspect-build/rules_py",
		"jmillikin/rules_ragel",
		"grailbio/rules_r",
		"ostera/rules_reason",
		"bazelruby/rules_ruby",
		"bazelbuild/rules_rust",
		"google/cargo-raze",
		"wildarch/blackjack",
		"bazelbuild/rules_sass",
		"bazelbuild/rules_scala",
		"higherkindness/rules_scala",
		"tweag/rules_sh",
		"filmil/bazel-bats",
		"Zetten/bazel-sonarqube",
		"salesforce/rules_spring",
		"bazelbuild/rules_swift",
		"ceason/rules_terraform",
		"mitchelldavis/rules_terraform",
		"lucidsoftware/rules_twirl",
		"sconover/rules_multi_tsc",
		"Lightelligence/rules_verilog",
		"quittle/rules_web",
		"lucidsoftware/rules_twirl",
		"vaticle/bazel-distribution",
		// todo plugins & toolchains
	}

	for _, r := range additionalRepos {
		modules = append(modules, Module{
			Repository: []string{"github:" + r},
		})
	}

	for _, module := range modules {
		for _, repo := range module.Repository {
			if strings.HasPrefix(repo, "github:") {
				r := strings.TrimPrefix(repo, "github:")
				log.Printf("%+v", r)
				err := clone(r, true)
				if err != nil {
					log.Printf("Error with repo %s", err)
				}
				err = getMetadata(r)
				if err != nil {
					log.Printf("Error getting metadata %s", err)
				}
				err = getReleases(r)
				if err != nil {
					log.Printf("Error getting releases %s", err)
				}

			} else {
				log.Printf("Unknown repo type: %+v", repo)
			}
		}
	}

	data := map[string]Data{}
	for _, module := range modules {
		for _, repo := range module.Repository {
			d := Data{
				Modules: []Module{},
			}
			// todo capture module name here
			if strings.HasPrefix(repo, "github:") {
				r := strings.TrimPrefix(repo, "github:")

				parts := strings.Split(r, "/")
				d.Owner = parts[0]
				d.Name = parts[1]

				f, err := os.ReadFile("metadata/" + r + "/releases.json")
				if err != nil {
					log.Printf("Error reading releases.json: %s", err)
				}

				var releases []Release
				err = json.Unmarshal(f, &releases)
				if err != nil {
					log.Printf("Error parsing releases.json: %s", err)
				}
				for i, r := range releases {
					var converted bytes.Buffer
					if err := md.Convert([]byte(r.Body), &converted); err != nil {
						panic(err)
					}
					releases[i].Body = string(converted.Bytes())
				}
				d.Releases = releases

				f, err = os.ReadFile("metadata/" + r + "/metadata.json")
				if err != nil {
					log.Printf("Error reading metadata.json: %s", err)
				}

				var metadata Repo
				err = json.Unmarshal(f, &metadata)
				if err != nil {
					log.Printf("Error parsing metadata.json: %s", err)
				}
				d.Repo = metadata

				f, err = os.ReadFile("repos/" + r + "/README.md")
				if err == nil {
					var converted bytes.Buffer
					if err := md.Convert(f, &converted); err != nil {
						panic(err)
					}
					d.Root.Readme = string(converted.Bytes())
				}

				fr, err := os.Open("repos/" + r + "/README.rst")
				// todo rules_go is so annoying
				if err == nil {
					p := rst.NewParser(nil)
					var converted bytes.Buffer
					w := bufio.NewWriter(&converted)
					p.ReStructuredText(fr, rst.ToHTML(w))
					readme := string(converted.Bytes())
					re := regexp.MustCompile(`(?s)<p[^>]*?>\.\.(.*?)</p>`)
					readme = re.ReplaceAllString(readme, "")
					d.Root.Readme = readme
				}

				f, err = os.ReadFile("repos/" + r + "/LICENSE")
				if err == nil {
					d.Root.License = string(f)
				}

				f, err = os.ReadFile("repos/" + r + "/MODULE.bazel")
				if err == nil {
					d.Root.Module = string(f)
				}
				if existingData, ok := data[r]; ok {
					if module.Name != "" {
						existingData.Modules = append(existingData.Modules, module)
						data[r] = existingData
					}
				} else {
					if module.Name != "" {
						d.Modules = append(d.Modules, module)
					}
					data[r] = d
				}
			}
		}
	}

	b, err := json.Marshal(data)
	if err != nil {
		log.Printf("error marshaling data: %s", err)
	}

	b = append([]byte("let data = "), b...)
	b = append(b, []byte("; module.exports=data;")...)
	err = ioutil.WriteFile("data/data.js", b, 0777)
	if err != nil {
		log.Printf("error writing data.js: %s", err)
	}

	// todo get docs

	// todo support repos that aren't in bcr (a nice way for us to provide additional data)

	// todo render all of this data in a nice way
	// - our custom metadata
	// - releases info
	// - BCR info
	// - sparse checkouts (license, readme, etc)

	// todo support refreshing this data regularly

	// todo make sure we don't hit rate limits
}

func getReleases(repo string) error {
	err := os.MkdirAll("metadata", 0777)

	if _, err := os.Stat("metadata/" + repo + "/releases.json"); !os.IsNotExist(err) {
		log.Printf("Already got releases for %s; skipping", repo)
		return nil
	}

	url := "https://api.github.com/repos/" + repo + "/releases"

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer "+os.Getenv("GITHUB_TOKEN"))
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	err = os.MkdirAll("metadata/"+repo, 0777)
	if err != nil {
		return err
	}

	os.WriteFile("metadata/"+repo+"/releases.json", body, 0777)
	log.Printf("Fetched releases for %s", repo)

	return nil
}

func getMetadata(repo string) error {
	err := os.MkdirAll("metadata", 0777)

	if _, err := os.Stat("metadata/" + repo + "/metadata.json"); !os.IsNotExist(err) {
		log.Printf("Already got metadata for %s; skipping", repo)
		return nil
	}

	url := "https://api.github.com/repos/" + repo

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Authorization", "Bearer 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")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	err = os.MkdirAll("metadata/"+repo, 0777)
	if err != nil {
		return err
	}

	os.WriteFile("metadata/"+repo+"/metadata.json", body, 0777)
	log.Printf("Fetched metadata for %s", repo)

	return nil
}

func clone(repo string, sparse bool) error {
	err := os.MkdirAll("repos", 0777)
	if err != nil {
		return err
	}
	if _, err := os.Stat("repos/" + repo); !os.IsNotExist(err) {
		log.Printf("Already cloned %s; skipping", repo)
		return nil
	}
	// err = os.MkdirAll("repos/"+repo, 0777)
	// if err != nil {
	// 	return err
	// }
	log.Printf("Cloning " + repo)
	// out, err := exec.Command("git", "clone", "https://github.com/"+repo, "repos/"+repo).CombinedOutput()

	opts := []string{"clone", "--depth=1"}
	if sparse {
		opts = append(opts, "--sparse")
	}
	opts = append(opts, "https://github.com/"+repo+".git")
	opts = append(opts, "repos/"+repo)

	out, err := exec.Command("git", opts...).CombinedOutput()
	if err != nil {
		os.RemoveAll("repos/" + repo)
		log.Printf(string(out))
		return err
	}
	return nil
}

func walk() ([]Module, error) {
	modules := []Module{}
	err := filepath.Walk("repos/bazelbuild/bazel-central-registry",
		func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if strings.HasSuffix(path, "metadata.json") {
				f, err := ioutil.ReadFile(path)
				if err != nil {
					return err
				}

				var module Module
				err = json.Unmarshal(f, &module)
				if err != nil {
					return err
				}

				parts := strings.Split(path, "/")
				module.Name = parts[4]

				modules = append(modules, module)
			}
			return nil
		})
	if err != nil {
		return nil, err
	}

	return modules, nil
}

type Maintainer struct {
	Email  string `json:"email"`
	Github string `json:"github"`
	Name   string `json:"name"`
}

type Module struct {
	Name           string                 `json:"name"`
	Homepage       string                 `json:"homepage"`
	Maintainers    []Maintainer           `json:"maintainers"`
	Repository     []string               `json:"repository"`
	Versions       []string               `json:"versions"`
	YankedVersions map[string]interface{} `json:"yanked_versions"`
}

type Data struct {
	Name     string    `json:"name"`
	Owner    string    `json:"owner"`
	Modules  []Module  `json:"modules"`
	Releases []Release `json:"releases"`
	Root     Root      `json:"root"`
	Repo     Repo      `json:"repo"`
}

type Root struct {
	Readme  string `json:"readme"`
	License string `json:"license"`
	Module  string `json:"module"`
}

type Release struct {
	URL       string `json:"url"`
	AssetsURL string `json:"assets_url"`
	UploadURL string `json:"upload_url"`
	HTMLURL   string `json:"html_url"`
	ID        int    `json:"id"`
	Author    struct {
		Login             string `json:"login"`
		ID                int    `json:"id"`
		NodeID            string `json:"node_id"`
		AvatarURL         string `json:"avatar_url"`
		GravatarID        string `json:"gravatar_id"`
		URL               string `json:"url"`
		HTMLURL           string `json:"html_url"`
		FollowersURL      string `json:"followers_url"`
		FollowingURL      string `json:"following_url"`
		GistsURL          string `json:"gists_url"`
		StarredURL        string `json:"starred_url"`
		SubscriptionsURL  string `json:"subscriptions_url"`
		OrganizationsURL  string `json:"organizations_url"`
		ReposURL          string `json:"repos_url"`
		EventsURL         string `json:"events_url"`
		ReceivedEventsURL string `json:"received_events_url"`
		Type              string `json:"type"`
		SiteAdmin         bool   `json:"site_admin"`
	} `json:"author"`
	NodeID          string `json:"node_id"`
	TagName         string `json:"tag_name"`
	TargetCommitish string `json:"target_commitish"`
	Name            string `json:"name"`
	Draft           bool   `json:"draft"`
	Prerelease      bool   `json:"prerelease"`
	CreatedAt       string `json:"created_at"`
	PublishedAt     string `json:"published_at"`
	Assets          []struct {
		URL                string `json:"url"`
		BrowserDownloadURL string `json:"browser_download_url"`
		ID                 int    `json:"id"`
		NodeID             string `json:"node_id"`
		Name               string `json:"name"`
		Label              string `json:"label"`
		State              string `json:"state"`
		ConentType         string `json:"content_type"`
		Size               int    `json:"size"`
		DownloadCount      int    `json:"download_count"`
		CreatedAt          string `json:"created_at"`
		UpdatedAt          string `json:"updated_at"`
	} `json:"assets"`
	TarballURL string `json:"tarball_url"`
	ZipballURL string `json:"zipball_url"`
	Body       string `json:"body"`
}

type Repo struct {
	ID               int     `json:"id"`
	NodeID           string  `json:"node_id"`
	Name             string  `json:"name"`
	FullName         string  `json:"full_name"`
	Private          bool    `json:"private"`
	Owner            Owner   `json:"owner"`
	HTMLURL          string  `json:"html_url"`
	Description      string  `json:"description"`
	Fork             bool    `json:"fork"`
	URL              string  `json:"url"`
	Language         string  `json:"language"`
	CreatedAt        string  `json:"created_at"`
	UpdatedAt        string  `json:"updated_at"`
	PushedAt         string  `json:"pushed_at"`
	GitURL           string  `json:"git_url"`
	SSHURL           string  `json:"ssh_url"`
	CloneUrl         string  `json:"clone_url"`
	Homepage         string  `json:"homepage"`
	Size             int     `json:"size"`
	StargazersCount  int     `json:"stargazers_count"`
	WatchersCount    int     `json:"watchers_count"`
	ForksCount       int     `json:"forks_count"`
	License          License `json:"license"`
	Visibility       string  `json:"visibility"`
	DefaultBranch    string  `json:"default_branch"`
	NetworkCount     int     `json:"network_count"`
	SubscribersCount int     `json:"subscribers_count"`
}

type License struct {
	Key    string `json:"key"`
	Name   string `json:"name"`
	SpdxID string `json:"spdx_id"`
	URL    string `json:"url"`
	NodeID string `json:"node_id"`
}

type Owner struct {
	Login     string `json:"login"`
	ID        int    `json:"id"`
	AvatarURL string `json:"avatar_url"`
	URL       string `json:"url"`
	Type      string `json:"type"`
}
