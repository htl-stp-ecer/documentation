# TechDocs - Product Documentation

A documentation site built with [Hugo](https://gohugo.io/) and deployed to GitHub Pages.

## Prerequisites

- [Hugo](https://gohugo.io/installation/) (extended edition recommended)

## Local Development

Clone the repository and start the development server:

```bash
git clone https://github.com/htl-stp-ecer/documentation.git
cd documentation
hugo server -D
```

The site will be available at `http://localhost:1313`. Changes to content and layouts are reflected immediately via live reload. The `-D` flag includes draft content.

## Building for Production

```bash
hugo --minify
```

The generated site will be in the `public/` directory.

## Deployment

Pushing to the `main` branch automatically triggers a GitHub Actions workflow that builds and deploys the site to GitHub Pages.

## License

CC BY 4.0
