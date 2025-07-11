---
title: Troubleshooting Next.js Blog Route Errors
date: 2025-05-19
summary: Fixing the same error many times
---

# Troubleshooting Next.js Blog Route Errors

This document summarizes common errors encountered while building a dynamic blog route in Next.js using TypeScript, and explains what went wrong and how to fix them.

---

## 1. Type Error: `params` should be awaited

### Error message
Error: Route "/blog/[slug]" used params.slug. params should be awaited before using its properties.

### Cause

Next.js dynamic route handlers sometimes expect `params` to be a Promise or an awaited object. Using `params.slug` directly without awaiting can cause this error.

### Resolution

- Confirm that your function parameter `params` is typed correctly and is not a `Promise` unless required by your Next.js version.
- Typically, you define props like this:

```ts
type Props = {
  params: {
    slug: string;
  };
};
```
- Use the parameter directly without await unless Next.js requires it in your setup.

## 2. Type Error: params missing Promise properties
Error message
```Type '{ params: { slug: string; }; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]
```

Cause

Your params type was expected to be a Promise but was defined as a plain object, causing TypeScript type mismatch.

Resolution

- Check your Next.js version and routing API to confirm whether params is a Promise or a plain object.

- For most Next.js 13+ setups, params is a plain object.

- Adjust your type accordingly, e.g.,
```
type Props = {
  params: {
    slug: string;
  };
};
```



## 3.   React Hook useEffect missing dependencies warning

Warning:

React Hook useEffect has missing dependencies: 'animate' and 'initializeStars'.

Cause:
Functions used inside useEffect are not listed as dependencies, which can cause stale closures or unexpected behavior.

Fix:

    Add animate and initializeStars to the dependency array, or

    Define these functions inside the useEffect, or

    Memoize them using useCallback.

## 4. Navigation with a instead of Link

Warning:

Do not use an <a> element to navigate to `/blog/`. Use `<Link />` from `next/link` instead.

Cause:
Next.js requires client-side routing via its <Link> component for better performance and prefetching.

Fix:
Replace:

<a href="/blog/">Blog</a>

with:

import Link from 'next/link';

<Link href="/blog/">Blog</Link>

Summary

    Always check your Next.js version and routing API to confirm expected types for route parameters.

    Define your dynamic route props with the correct types to avoid TypeScript errors.

    Remove or comment out unused variables to satisfy ESLint.

    Follow React Hooks rules to avoid warnings about missing dependencies.

    Use Next.js <Link> component for navigation instead of raw <a> elements.



    Also markdown is kinda funny sometimes.  I  will get the hang of it...Not quite sure why the green highlighting is happening.  I am pretty sure there are some escape symbols I need to use so i can use Link and a in a markdwon file.


    chekc chekc chekc