# WordPress Post Processor

[![Powered by Bun](https://img.shields.io/badge/Powered%20by-Bun-black?style=flat&logo=bun)](https://bun.sh/)

A **JavaScript-based tool** for fetching WordPress posts via the public REST API, processing their HTML, and converting the content into **Markdown**. Built to run in a **Node.js environment** (with Bun). 🚀

---

## 📦 Features

- Fetch posts from any public WordPress site.
- Convert HTML post content to clean Markdown.
- Save processed posts locally as `.md` files.
- Simple configuration using a `.env` file.

---

## 🛠 Prerequisites

Before you start, make sure you have the following installed:

- **[Bun](https://bun.sh/)**: A fast JavaScript all-in-one toolkit.
- A **WordPress site** with the REST API enabled (most public WP sites have it enabled by default).

---

## 📥 Installation

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/avestair/wordpress-post-processor.git](https://github.com/avestair/wordpress-post-processor.git)
    cd wordpress-post-processor
    ```

2.  **Install the dependencies:**
    ```bash
    bun install
    ```

---

## ⚙️ Configuration

Configuration is managed through a `.env` file.

1.  **Create a `.env` file** by copying the example file:

    ```bash
    cp .env.example .env
    ```

2.  **Edit the `.env` file** and add your WordPress site's URL:

    ```dotenv
    # The base URL of the WordPress site you want to fetch posts from
    WP_BASE_URL="[https://your-wordpress-site.com](https://your-wordpress-site.com)"
    ```

---

## 🚀 Usage

Once your `.env` file is configured, you can run the script with a single command:

```bash
bun run dev
```
