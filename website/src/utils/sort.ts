export function popularity(a, b) {
  let aScore = a.repo.stargazers_count;
  let bScore = b.repo.stargazers_count;
  if (a.name.includes("rules_")) aScore = aScore * 100;
  if (b.name.includes("rules_")) bScore = bScore * 100;
  return bScore - aScore;
}
