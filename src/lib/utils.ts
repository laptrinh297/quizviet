import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/-$/, '')
}

/** Build a user-friendly set URL: /sets/<cuid>-<slug> */
export function setUrl(id: string, title: string): string {
  const slug = slugify(title)
  return slug ? `/sets/${id}-${slug}` : `/sets/${id}`
}

/** Extract the raw cuid from a slug param like "clxyz123-ten-bo-the" */
export function extractSetId(param: string): string {
  return param.split('-')[0]
}
