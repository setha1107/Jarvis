const BASE = "/api/social";

export async function listAccounts() {
  const r = await fetch(`${BASE}/accounts`);
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.accounts || [];
}

export async function createAccount(payload) {
  const r = await fetch(`${BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.account;
}

export async function updateAccount(id, patch) {
  const r = await fetch(`${BASE}/accounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.account;
}

export async function deleteAccount(id) {
  const r = await fetch(`${BASE}/accounts/${id}`, { method: "DELETE" });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return true;
}
