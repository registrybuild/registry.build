package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/dghubble/go-twitter/twitter"
	"github.com/dghubble/oauth1"
)

var (
	consumerKey       = flag.String("consumer_key", "", "the twitter consumer key to use")
	consumerSecret    = flag.String("consumer_secret", "", "the twitter consumer secret to use")
	accessToken       = flag.String("access_token", "", "the twitter access token to use")
	accessTokenSecret = flag.String("access_token_secret", "", "the twitter access token secret to use")
)

func main() {
	file, err := os.Open("data/diff.txt")
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer file.Close()

	pattern := `\+    html_url: "https://github.com/(.+?)/(.+?)/releases/tag/(.+?)"`

	regex, err := regexp.Compile(pattern)
	if err != nil {
		fmt.Println("Error compiling regex pattern:", err)
		return
	}

	scanner := bufio.NewScanner(file)

	newReleases := []Release{}

	for scanner.Scan() {
		line := scanner.Text()
		if m := regex.FindStringSubmatch(line); len(m) > 0 {
			newReleases = append(newReleases, Release{
				Owner:   m[1],
				Repo:    m[2],
				Version: strings.TrimPrefix(m[3], "v"),
			})
			fmt.Printf("owner: %s, repo: %s, version %s\n", m[1], m[2], m[3])
		}
	}

	if err := scanner.Err(); err != nil {
		fmt.Println("Error reading file:", err)
		return
	}

	for _, release := range newReleases {
		sendTweet("Version " + release.Version + " of " + release.Repo + " is now live on The Build Registry. https://registry.build/github/" + release.Owner + "/" + release.Repo + "/")
		time.Sleep(5 * time.Second)
	}
}

func sendTweet(tweet string) {
	config := oauth1.NewConfig(*consumerKey, *consumerSecret)
	token := oauth1.NewToken(*accessToken, *accessTokenSecret)

	httpClient := config.Client(oauth1.NoContext, token)

	client := twitter.NewClient(httpClient)

	_, _, err := client.Statuses.Update(tweet, nil)
	if err != nil {
		log.Fatal("Error sending tweet:", err)
	}

	fmt.Println("Tweet sent:", tweet)
}

type Release struct {
	Owner   string
	Repo    string
	Version string
}
