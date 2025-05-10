/// <reference lib="es2015"/>

declare function collectResourceMap(obj: any): Map<string, Object>;

declare function patchResources(obj: any, map: Map<string, Object>): any;

declare function pruneResources(obj: any, integrity: string): any;

export { collectResourceMap, patchResources, pruneResources };