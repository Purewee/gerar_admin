# Deployment Guide for cPanel

## The Problem
You're seeing this error because cPanel is trying to execute TypeScript source files directly. TypeScript files must be compiled to JavaScript before deployment.

## Solution: Build and Deploy Correctly

### Step 1: Build the Project Locally

Run the build command on your local machine:

```bash
pnpm build
```

or if you're using npm:

```bash
npm run build
```

This will create a `dist` folder containing all the compiled JavaScript files and static assets.

### Step 2: Upload to cPanel

**IMPORTANT: Only upload the contents of the `dist` folder, NOT the source files!**

1. After building, navigate to the `dist` folder in your project
2. Upload ALL files and folders from inside `dist` to your cPanel `public_html` directory (or your domain's document root)
3. The `.htaccess` file will be automatically included in the `dist` folder (it's in the `public` folder and gets copied during build)

### Step 3: Verify File Structure

Your cPanel directory should look like this:
```
public_html/
├── .htaccess
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── [other static files]
```

**DO NOT** upload:
- `src/` folder
- `node_modules/` folder
- `package.json`
- TypeScript config files
- Vite config files
- Any other source files

### Step 4: Verify the Build

1. Check that your cPanel file manager shows an `index.html` file in the root
2. Visit your domain in a browser
3. The app should load without TypeScript errors

## Troubleshooting

### If you still see errors:

1. **Clear browser cache** - Sometimes old cached files can cause issues
2. **Check file permissions** - Ensure files are readable (644) and folders are executable (755)
3. **Verify .htaccess is present** - The `.htaccess` file is needed for proper routing
4. **Check cPanel error logs** - Look in cPanel's error log section for more details

### Common Issues:

- **404 errors on routes**: Make sure `.htaccess` is uploaded and mod_rewrite is enabled on your server
- **Blank page**: Check browser console for JavaScript errors
- **CSS not loading**: Verify asset paths are correct in the built `index.html`

## Alternative: Use cPanel Node.js App (Not Recommended)

If your cPanel has Node.js support and you want to run the dev server:
1. This is NOT recommended for production
2. You would need to install dependencies on the server
3. You would need to keep the Node.js process running
4. Performance will be worse than static hosting

**Recommended approach**: Always build locally and upload static files.
