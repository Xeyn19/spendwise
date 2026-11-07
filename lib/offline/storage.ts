import type { DashboardSnapshot, OfflineMutation } from "@/lib/offline/types";

const DATABASE_NAME = "spendwise-offline";
const DATABASE_VERSION = 1;
const SNAPSHOTS_STORE = "dashboard-snapshots";
const MUTATIONS_STORE = "pending-mutations";

let databasePromise: Promise<IDBDatabase> | undefined;

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error), { once: true });
  });
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error), { once: true });
    transaction.addEventListener("error", () => reject(transaction.error), { once: true });
  });
}

function openDatabase() {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        database.createObjectStore(SNAPSHOTS_STORE, { keyPath: "userId" });
      }

      if (!database.objectStoreNames.contains(MUTATIONS_STORE)) {
        const store = database.createObjectStore(MUTATIONS_STORE, { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
    });

    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error), { once: true });
  });

  return databasePromise;
}

export async function readDashboardSnapshot(userId: string) {
  const database = await openDatabase();
  const transaction = database.transaction(SNAPSHOTS_STORE, "readonly");
  return requestResult(
    transaction.objectStore(SNAPSHOTS_STORE).get(userId) as IDBRequest<DashboardSnapshot | undefined>
  );
}

export async function writeDashboardSnapshot(snapshot: DashboardSnapshot) {
  const database = await openDatabase();
  const transaction = database.transaction(SNAPSHOTS_STORE, "readwrite");
  transaction.objectStore(SNAPSHOTS_STORE).put(snapshot);
  await transactionComplete(transaction);
}

export async function addPendingMutation(mutation: OfflineMutation) {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATIONS_STORE, "readwrite");
  transaction.objectStore(MUTATIONS_STORE).put(mutation);
  await transactionComplete(transaction);
}

export async function readPendingMutations(userId: string) {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATIONS_STORE, "readonly");
  const request = transaction.objectStore(MUTATIONS_STORE).index("userId").getAll(userId);
  const mutations = await requestResult(request as IDBRequest<OfflineMutation[]>);
  return mutations.toSorted((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function removePendingMutation(id: string) {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATIONS_STORE, "readwrite");
  transaction.objectStore(MUTATIONS_STORE).delete(id);
  await transactionComplete(transaction);
}

export async function countPendingMutations(userId: string) {
  const database = await openDatabase();
  const transaction = database.transaction(MUTATIONS_STORE, "readonly");
  return requestResult(transaction.objectStore(MUTATIONS_STORE).index("userId").count(userId));
}

export async function clearOfflineUserData(userId: string) {
  const database = await openDatabase();
  const transaction = database.transaction([SNAPSHOTS_STORE, MUTATIONS_STORE], "readwrite");
  transaction.objectStore(SNAPSHOTS_STORE).delete(userId);
  const mutationStore = transaction.objectStore(MUTATIONS_STORE);
  const keys = await requestResult(mutationStore.index("userId").getAllKeys(userId));

  for (const key of keys) {
    mutationStore.delete(key);
  }

  await transactionComplete(transaction);
}
