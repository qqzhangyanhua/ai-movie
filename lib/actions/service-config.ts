// DEPRECATED: ServiceConfig model has been removed from schema.
// This file is kept for backward compatibility only.
// Service configurations are now managed at system level via environment variables.

"use server";

export async function getServiceConfigs() {
  return [];
}

export async function getActiveServiceConfig() {
  return null;
}

export async function createServiceConfig() {
  throw new Error("ServiceConfig is deprecated. Use environment variables instead.");
}

export async function updateServiceConfig() {
  throw new Error("ServiceConfig is deprecated. Use environment variables instead.");
}

export async function deleteServiceConfig() {
  throw new Error("ServiceConfig is deprecated. Use environment variables instead.");
}

export async function setActiveServiceConfig() {
  throw new Error("ServiceConfig is deprecated. Use environment variables instead.");
}
