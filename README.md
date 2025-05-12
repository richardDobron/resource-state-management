# resource-state-management ![](https://github.com/richardDobron/resource-state-management/workflows/tests/badge.svg) [![npm](https://img.shields.io/npm/v/resource-state-management.svg)](https://www.npmjs.com/package/resource-state-management)

A lightweight utility for efficient patching and pruning of objects in JavaScript/TypeScript state trees.

---

## 🌟 Features

- **Integrity-based Object Management**: Update or remove objects in a state tree using unique integrity keys.
- **Recursive Scanning**: Automatically traverse nested objects and arrays for resource mapping.
- **Lightweight & Flexible**: Works seamlessly with popular state management libraries like SWR.

---

## 📋 Prerequisites

To use this library effectively, ensure the following:

- Each object in your state tree must have a unique **integrity key**.
- Objects without an integrity key will be ignored during operations.

### Example Object Structure:

```json
{
  "id": 1,
  "integrity": "company-1",
  "name": "ACME Corp",
  "employees": [
    {
      "id": 2,
      "integrity": "employee-2",
      "name": "John Doe"
    }
  ]
}
```

## 📦 Installation

Install the package using npm:

```bash
npm install resource-state-management
```

## 🔗 Generating and Using Integrity Keys

An **integrity key** is a unique code for each object in your state tree. It helps keep things consistent and avoids errors.

### Why Use Integrity Keys?

- **Consistency**: The same object will always have the same key.
- **Avoiding Conflicts**: A good key avoids mistakes where two different objects get the same key.
- **No Extra Tools Needed**: You don’t need extra counters or unique ID generators—the key comes directly from the object’s data.

### Example: Creating Integrity Keys

#### In JavaScript:
```javascript
import md5 from 'md5';

function calculateResourceIntegrity(objectType, id) {
  return md5(`${objectType}-${id}`);
}
```

#### In PHP:
```php
function calculateResourceIntegrity(string $objectType, int $id) {
  return md5("$objectType-$id");
}
```

## ⚙️ API Usage

### collectResourceMap(obj: any): Map<string, object>

- Recursively scans an object or array and builds a `Map<integrity, object>` of all nested resources.

### patchResources(obj: any, map: Map<string, object>): any

- Merges (shallow spread) matched objects from the resource map into the state tree and returns a new tree.

### pruneResources(obj: any, integrity: string): any | undefined

- Removes any nested object whose `integrity` matches the provided integrity key, and prunes `undefined` values from the tree.

## ⚡️ Example Integration with SWR

Here's how you can integrate `resource-state-management` into an SWR-based application:

```diff
import { mutate } from 'swr';
+ import { collectResourceMap, patchResources, pruneResources } from 'resource-state-management';

+ async function patchResource(response: any) {
+     const map = collectResourceMap(response);
+     await mutate(
+         () => true, // Update global state
+         (cache: any) => patchResources(cache, map),
+         false
+     );
+ }

+ async function pruneResource(integrity: string) {
+   await mutate(
+     () => true,
+     (cache: any) => pruneResources(cache, integrity),
+     false
+   );
+ }

export async function createCompany(data) {
    const response = await api.createCompany(data);

    await mutate(
        "api/companies",
        (cache: any) => [response, ...cache],
        false
    );
}

export async function updateCompany(data) {
    const response = await api.updateCompany(data);

+   await patchResource(response);
-   await mutate(
-       "api/companies",
-       (cache: any) => cache.map(company => company.id === response.id ? response : company),
-       false
-   );
}

async function deleteCompany(company) {
    const response = await api.deleteCompany(company);

-   await mutate(
-       "api/companies",
-       (currentData: any) => currentData.filter(company => company.id !== response.id),
-       false
-   );
+   await pruneResource(company.integrity);
}
```

## 🔍 Performance & Best Practices

- **Batch Updates**: Apply multiple integrity patches in a single `patchResources` call for better performance.
- **Selective Mutations**: Target specific SWR cache keys instead of global state (`() => true`).

## ⚖️ License

This plugin is licensed under the MIT license. See [LICENSE](./LICENSE).