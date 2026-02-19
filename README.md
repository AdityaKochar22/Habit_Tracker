# 🌱 Daily Habit Tracker

A beautiful, minimalist habit tracking app built with React that helps you build consistency through detailed progress tracking, streak monitoring, and insightful analytics.

![Habit Tracker](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 📊 **Habit Tracking**
- **8 Pre-configured Habits** across two categories:
  - **Health & Fitness**: Water intake (8 glasses), stretching (10 min), abs exercises (30 min), daily steps (5,000)
  - **Nutrition & Lifestyle**: Vegetables (3 servings), avoid sugary drinks, take vitamins, bedtime (before 11pm)

### 📈 **Partial Progress Tracking**
- Track **partial completion** for each habit (e.g., 7 out of 8 glasses of water = 87%)
- Visual **progress rings** around each habit icon showing today's completion %
- Color-coded progress indicators:
  - 🟢 Green (100%): Goal achieved
  - 🟠 Amber (60–99%): Good progress
  - 🟠 Orange (1–59%): Partial effort
  - 🔴 Red (0%): No progress

### ✏️ **Full Entry Management**
- **Add entries** for any day with a smooth modal interface
- **Edit existing entries** — click the Edit button on any past entry
- **Delete entries** when needed
- Live progress visualization as you adjust counts with +/− buttons or slider
- Real-time feedback showing how many more you need to reach your goal

### 🔥 **Streak System**
- Automatic streak tracking for consecutive days of completion
- **Streak badges** with escalating rewards:
  - ⚡ **3+ days**: Green "Streak" badge
  - 🔥 **10+ days**: Purple "Amazing Streak" badge
  - 👑 **20+ days**: Gold "Legend" badge
- Streak displayed on each habit card and in detail views

### 📱 **Three Main Views**

#### 1. **Habits List** (Main Screen)
- Grid layout showing all habits with:
  - Today's progress ring around icon
  - Partial completion % (e.g., "7/8 today (87%)")
  - Overall success rate
  - Current streak
- Responsive grid: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)

#### 2. **Habit Detail View**
Three tabs per habit:
- **Entries Tab**: Complete history with edit/delete options, mini progress bars showing partial completion
- **Overview Tab**: 6-stat dashboard including success rate, average completion %, current streak, total wins/fails, and daily goal
- **Report Tab**: 14-day bar chart showing partial progress % for each day with color-coded legend

#### 3. **Dashboard**
Analytics across all habits:
- **Summary cards**: Today's completion, total entries, best streak, habits tracked
- **Last 7 days chart**: Visual bar graph showing daily completion rates
- **Category performance**: Success rate breakdown by Health & Fitness vs Nutrition & Lifestyle
- **Habit leaderboard**: All habits ranked by average completion % with 🥇🥈🥉 medals

### 💾 **Data Persistence**
- All entries saved to browser `localStorage`
- Data persists across sessions and page refreshes
- No backend required — works 100% offline

### 🎨 **Design**
- **Minimalist light color scheme** with soft green accents
- Clean, modern UI with smooth animations and transitions
- Fully responsive — works on mobile, tablet, and desktop
- Custom fonts: DM Serif Display (headings) + DM Sans (body)
- Thoughtful micro-interactions (progress rings, hover states, modal animations)

---

### Prerequisites
- Node.js 16+ and npm

---

## 🛠️ Tech Stack

- **React 18** — UI framework
- **Vite** — Build tool and dev server
- **CSS-in-JS** — Inline styles for component-scoped styling
- **localStorage** — Client-side data persistence
- **Google Fonts** — DM Serif Display & DM Sans

---

## 📝 License

MIT License — feel free to use this project for personal or commercial purposes.

---

## 🙏 Acknowledgments

- Built with ❤️ using React and Vite
- Icons: Emoji (built into most systems)
- Fonts: [DM Serif Display](https://fonts.google.com/specimen/DM+Serif+Display) & [DM Sans](https://fonts.google.com/specimen/DM+Sans) by Google Fonts

---

## 🚧 Future Enhancements

- [ ] Custom habit creation
- [ ] Export data as CSV/JSON
- [ ] Dark mode toggle
- [ ] Cloud sync with Firebase/Supabase
- [ ] Mobile app (React Native)
- [ ] Reminders and notifications

---

**Happy habit building! 🌱**
