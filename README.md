# ⚽ Football Analytics & Player Dashboard

A full-stack web application designed for amateur football teams to track match statistics, generate FIFA-style player cards, and visualize season-long performance. Built with React, Node.js, and a unique Git-backed JSON database for seamless cloud syncing.

![Dashboard Preview](https://img.shields.io/badge/React-18-blue) ![Node](https://img.shields.io/badge/Node.js-Express-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Key Features

### 📊 Match Logging & Management
* **Detailed Stat Tracking:** Log goals (left foot, right foot, head), assists, ratings, and match outcomes (Win/Loss/Draw).
* **Head-to-Head Comparison:** Instantly compare the stats of two players who played in the exact same match.
* **Interactive Calendar:** Visualize your season with a match calendar featuring hover-tooltips and outcome color-coding.

### 🪪 FIFA-Style Player Cards
* **Customizable Attributes:** Generate player cards with 28 detailed sub-stats that auto-calculate into the 6 main EA categories (PAC, SHO, PAS, DRI, DEF, PHY).
* **Goalkeeper Support:** Specialized stat tracking for GKs (DIV, HAN, KIC, REF, SPD, POS).
* **Profile Management:** Upload profile pictures, set preferred/weak foot accuracy, and assign playable position ratings.

### 📈 Advanced Analytics Dashboard
* **Season Summaries:** Filter by season to view average ratings, total goal contributions, and overall win rates.
* **Location Performance:** See which pitches/locations yield the highest average goal contributions.
* **Form & Streaks:** Visual trend graphs to track a player's rating momentum over time.

### ☁️ Auto-Sync Database
* **Zero-Config Cloud Sync:** The backend uses `simple-git` to automatically `add`, `commit`, and `push` changes to your GitHub repository every time a stat is saved or modified.

---

## 🚀 Quick Start (Automated)

This project includes smart startup scripts that automatically check for Node.js/Git, install dependencies, pull the latest code, and launch both the frontend and backend.

### 🪟 For Windows Users
1. Download/Clone this repository to your computer.
2. Double-click the **`start.bat`** file.
3. The script will open the app in your browser at `http://localhost:3000`.

### 🍎 For macOS Users
1. Download/Clone this repository to your computer.
2. Open **Terminal**, navigate to the project folder, and run:
   ```bash
   chmod +x start.sh
   ./start.sh
