import { z } from 'zod'

/**
 * The `updatedAt` an editor loaded, echoed back on save for optimistic
 * concurrency (lib/actions/README.md). ISO 8601, with or without an offset.
 */
export const concurrencyStamp = z.string().datetime({ offset: true, message: 'updatedAt must be an ISO timestamp' })

/** A row id from the browser: a positive integer, nothing else. */
export const rowId = z.number().int().positive()
