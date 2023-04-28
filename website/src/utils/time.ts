export function since(date: string) {
  let [count, unit] = subtractDates(date);
  let singlar = `${count} ${unit}`;
  if (count == 1) return singlar;
  return `${singlar}s`;
}

export function subtractDates(date: string) {
  let diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return [Math.floor(diff), "second"];
  if (diff < 3600) return [Math.floor(diff / 60), "minute"];
  if (diff < 86400) return [Math.floor(diff / 3600), "hour"];
  if (diff < 604800) return [Math.floor(diff / 86400), "day"];
  if (diff < 2592000) return [Math.floor(diff / 604800), "week"];
  if (diff < 31536000) return [Math.floor(diff / 2592000), "month"];
  return [Math.floor(diff / 31536000), "year"];
}
