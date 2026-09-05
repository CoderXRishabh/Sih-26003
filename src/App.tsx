import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import matchPairsThumbnail from "@/imports/ChatGPT_Image_Sep_4__2026__05_05_52_PM.png";
import mindsnapThumbnail from "@/imports/mindsnap_thumbnail.png";
import smrititaalThumbnail from "@/imports/smrititaal_thumbnail.png";
import sangaThumbnail from "@/imports/sanga_thumbnail.png";
import mindsnapCasualImg from "@/imports/mindsnap_casual.png";
import mindsnapFocusedImg from "@/imports/mindsnap_focused.png";
import mindsnapExpertImg from "@/imports/mindsnap_expert.png";
import * as api from "./api";
import { initSocketConnection, subscribeSync, disconnectSocket } from "./socket";

// ── Language system ────────────────────────────────────────────────────────

type Lang = "en" | "as" | "mn";

const TRANSLATIONS: Record<string, Record<Lang, string>> = {
  // Onboarding
  chooseLanguage:    { en: "Choose your language", as: "আপোনাৰ ভাষা বাছক", mn: "নংগী মরূপ চয়নবিয়ু" },
  continue:          { en: "Continue →",            as: "আগবাঢ়ক →",         mn: "হন্না চৎলু →" },
  // Greeting
  goodMorning:       { en: "Good morning",    as: "শুভ ৰাতিপুৱা",   mn: "নুমিৎ থোকপা" },
  goodAfternoon:     { en: "Good afternoon",  as: "শুভ অপৰাহ্ন",    mn: "নুমিৎ তরেৎ" },
  goodEvening:       { en: "Good evening",    as: "শুভ সন্ধিয়া",   mn: "হউজিক থোকপা" },
  // Home cards
  playRemember:      { en: "Play & Remember",        as: "খেলা আৰু মনত ৰখা",   mn: "লৈহাউ অমসুং লৌশিং" },
  memoryGames:       { en: "Memory game",             as: "স্মৃতি খেলা",          mn: "লৌশিং লৈহাউ" },
  myReminders:       { en: "My Reminders",            as: "মোৰ সোঁৱৰণি",         mn: "ঐগী সোংথিং" },
  medicineMeals:     { en: "Medicine & meals",        as: "দৰব আৰু আহাৰ",        mn: "ওষধ অমসুং চাকখৈ" },
  talkSmriti:        { en: "Talk to Smriti",          as: "স্মৃতিৰ সৈতে কথা",    mn: "স্মৃতিগা ৱারিকথে" },
  aiCompanion:       { en: "Your AI care companion",  as: "আপোনাৰ AI যত্ন সংগী", mn: "নংগী AI মরুপ" },
  callFamily:        { en: "Call Family",             as: "পৰিয়ালক ফোন কৰক",    mn: "ইমুং শীজিন্নবিয়ু" },
  familyNames:       { en: "Ananya & Ranjit",         as: "অনন্যা আৰু ৰঞ্জিত",  mn: "অনন্যা অমসুং ৰঞ্জিত" },
  // Reminders section
  todayReminders:    { en: "Today's Reminders",  as: "আজিৰ সোঁৱৰণি",  mn: "ফজথা সোংথিং" },
  seeAll:            { en: "See all →",           as: "সকলো চাওক →",   mn: "মরম চাবিয়ু →" },
  // Reminder items
  takeMedicine:      { en: "Take Medicine",          as: "দৰব খাওক",          mn: "ওষধ চাবিয়ু" },
  drinkWater:        { en: "Drink Water",             as: "পানী খাওক",          mn: "উ চাবিয়ু" },
  lunch:             { en: "Lunch",                   as: "মধ্যাহ্নভোজন",       mn: "নুমিৎ তরেৎ চাকখৈ" },
  doctorAppt:        { en: "Doctor Appointment",      as: "চিকিৎসকৰ সাক্ষাৎ",  mn: "দাক্তর থাজবা" },
  // Nav
  navHome:           { en: "Home",       as: "ঘৰ",       mn: "ইমুং" },
  navPlay:           { en: "Play",       as: "খেলা",     mn: "লৈহাউ" },
  navReminders:      { en: "Reminders",  as: "সোঁৱৰণি", mn: "সোংথিং" },
  navSettings:       { en: "Settings",   as: "সংস্থাপন", mn: "থৌরাং" },
  // Game
  matchPairs:        { en: "Match the Pairs",   as: "যোৰ মিলাওক",          mn: "পেয়ার মিলহনবিয়ু" },
  doingGreat:        { en: "You're doing great!", as: "আপুনি বহুত ভাল কৰিছে!", mn: "নং বহুত নাকল চৎলে!" },
  needHint:          { en: "Need a hint?",        as: "ইংগিত লাগেনে?",          mn: "হিন্ট লাকপ ঙমবা?" },
  hintUsed:          { en: "Hint used",            as: "ইংগিত ব্যৱহাৰ হৈছে",   mn: "হিন্ট ব্যৱহার অইরে" },
  playAgain:         { en: "Play again",           as: "আকৌ খেলা",              mn: "হন্না লৈহাউ" },
  // Smriti screen
  tapSpeak:          { en: "Tap to speak",         as: "কথা ক'বলৈ টেপ কৰক",   mn: "ৱারিকথনবিয়ু টেপ তৌবিয়ু" },
  listening:         { en: "Listening…",           as: "শুনিছো…",               mn: "থাজবা…" },
  startOver:         { en: "Start over",           as: "আকৌ আৰম্ভ কৰক",        mn: "হন্না শুরু তৌবিয়ু" },
  howFeeling:        { en: "How are you feeling today?", as: "আজি আপুনি কেনে অনুভৱ কৰিছে?", mn: "ফজথা নং কদায়না লৈবা?" },
  happy:             { en: "Happy 😊",  as: "সুখী 😊",   mn: "খুৎলম 😊" },
  tired:             { en: "Tired 😴",  as: "ক্লান্ত 😴", mn: "মনাক 😴" },
  needHelp:          { en: "Need help 🙏", as: "সহায় লাগে 🙏", mn: "মতুং লাক্লিবা 🙏" },
  // Chit chat
  chitChat:          { en: "Daily Chit Chat",        as: "দৈনিক কথাবাৰ্তা",       mn: "ফজথা ৱারিকথবা" },
  chitChatSub:       { en: "Chat with Smriti",       as: "স্মৃতিৰ সৈতে কথা",      mn: "স্মৃতিগা ৱারিকথবা" },
  chitChatTitle:     { en: "Daily Chit Chat",        as: "দৈনিক কথাবাৰ্তা",       mn: "ফজথা ৱারিকথবা" },
  nextQuestion:      { en: "Next question →",        as: "পৰৱৰ্তী প্ৰশ্ন →",      mn: "হন্না চিংথং →" },
  wellDone:          { en: "Well done! 🌿",           as: "বহুত ভাল! 🌿",           mn: "নাকল চৎলে! 🌿" },
  allDone:           { en: "That's all for today!",  as: "আজিৰ বাবে এয়াই!",      mn: "ফজথাগীদমক মখা মতমদা!" },
  chatAgain:         { en: "Chat again",             as: "আকৌ কথা পাতক",          mn: "হন্না ৱারিকথবিয়ু" },
  // Voice quiz
  tapRecord:         { en: "Tap to record your answer",  as: "আপোনাৰ উত্তৰ ৰেকৰ্ড কৰক",    mn: "নংগী পাওখুম ৰেকৰ্ড তৌবিয়ু" },
  recording:         { en: "Recording...",               as: "ৰেকৰ্ডিং...",                   mn: "ৰেকৰ্ড তৌরি..." },
  stopRec:           { en: "Tap to stop",                as: "বন্ধ কৰক",                      mn: "থিংহনবিয়ু" },
  quit:              { en: "Quit",                       as: "এৰি দিয়ক",                     mn: "থাদোক্কনি" },
  backToHome:        { en: "Back to Home",               as: "ঘৰলৈ যাওক",                    mn: "ইমুংদা হনবিয়ু" },
  processing:        { en: "Analyzing your responses...", as: "আপোনাৰ উত্তৰ বিশ্লেষণ কৰিছে...", mn: "নংগী পাওখুম চুকদুনা য়েংলি..." },
  listenQuestion:    { en: "Listen to the question",     as: "প্ৰশ্নটো শুনক",                  mn: "ৱাহংসিদু তাবিয়ু" },
  questionOf:        { en: "Question",                   as: "প্ৰশ্ন",                         mn: "ৱাহং" },
  of:                { en: "of",                         as: "ৰ ভিতৰত",                        mn: "গী মনুংদা" },
  // Caregiver dashboard
  chatsAnalysis:     { en: "Chats Analysis",             as: "কথাবাৰ্তা বিশ্লেষণ",              mn: "ৱারিকথবা চুকদুনা" },
  alerts:            { en: "Alerts",                     as: "সতৰ্কতা",                        mn: "অচৌবা ৱারোল" },
  moodTrend:         { en: "Mood Trend",                 as: "মানসিক প্ৰৱণতা",                 mn: "ৱাখল লমজেল" },
  recentSummary:     { en: "Recent Summary",             as: "শেহতীয়া সাৰাংশ",                 mn: "অহৌবা সারাংশ" },
  noSessions:        { en: "No chit-chat sessions yet",  as: "এতিয়ালৈকে কোনো কথাবাৰ্তা নাই",    mn: "হন্না ৱারিকথখিদে" },
  // Caregiver login
  caregiverLogin:    { en: "Caregiver Login",       as: "যত্নকাৰীৰ লগইন",    mn: "কেয়ারগিভার লগইন" },
  emailAddress:      { en: "Email address",         as: "ইমেইল ঠিকনা",        mn: "ইমেইল এড্রেস" },
  password:          { en: "Password",              as: "পাছৱৰ্ড",             mn: "পাছৱর্ড" },
  login:             { en: "Login",                 as: "প্ৰৱেশ কৰক",          mn: "লগইন তৌবিয়ু" },
  loginOtp:          { en: "Login with OTP instead", as: "OTP ৰে প্ৰৱেশ কৰক", mn: "OTP দ্বারা লগইন তৌবিয়ু" },
  // Games Screen Multilingual Titles & Descriptions
  matchPairsDesc:        { en: "Exercise your memory with colorful image cards.", as: "ৰঙীন ছবিৰ কাৰ্ডৰ সৈতে স্মৃতিৰ অভ্যাস কৰক।", mn: "মচু অমসুং ছবি কাৰ্ডশিংগা লোয়ননা লৌশিং লৈহাউ তৌবিয়ু।" },
  mindsnapTitle:         { en: "Mindsnap Arcade", as: "মাইণ্ডস্নেপ আৰ্কেড", mn: "মাইন্ডস্নেপ আর্কেড" },
  mindsnapDesc:          { en: "Memorize glowing pattern tiles and rebuild them before focus slips!", as: "জিলিকি থকা টাইলৰ পেটাৰ্ন মনত ৰাখক আৰু সঠিকভাৱে সজাওক!", mn: "ঙাল্লিবা পেটার্ন তাইলসিং মনদা থম্বিয়ু অমসুং হন্না শেমগৎবিয়ু!" },
  smritiTaalTitle:       { en: "Smriti Taal", as: "স্মৃতি তাল", mn: "স্মৃতি তাল" },
  smritiTaalDesc:        { en: "Rhythm & sound sequence memory game with regional instrument beats!", as: "দেশীয় বাদ্যযন্ত্ৰৰ শব্দ আৰু তাল মনত ৰখা সৰস স্মৃতি খেল!", mn: "থাইনগী যোং অমসুং শেক থিংবগী শব্দ অমসুং তাল লৈহাউ!" },
  sangaTitle:            { en: "Sanga Memory", as: "শাংগা স্মৃতি", mn: "শা-ঙা লৈহাউ" },
  sangaDesc:             { en: "Calm memory & recall practice with objects, categories, missing items & patterns!", as: "বস্তু, শ্ৰেণী, নোহোৱা বস্তু আৰু পেটাৰ্নৰ শান্ত স্মৃতি অভ্যাস!", mn: "পোত-চৈ, ক্যাটেগরি অমসুং পেটার্ন মনদা থম্বগী শান্ত লৈহাউ!" },
  popularTag:            { en: "Popular", as: "জনপ্ৰিয়", mn: "মিয়ামগী" },
  newTag:                { en: "New", as: "নতুন", mn: "অনৌবা" },
  allTimeProgressReport: { en: "All-Time Progress Report", as: "সকলো সময়ৰ প্ৰগতিৰ প্ৰতিবেদন", mn: "মতম পুম্বগী সোংথিং চুকদুনা" },
  trackAccuracyScore:    { en: "Track your accuracy and cognitive memory scores", as: "আপোনাৰ সঠিকতা আৰু স্মৃতিশক্তিৰ ফলাফল অনুসৰণ কৰক", mn: "নংগী চপ চাব অমসুং লৈহাউ স্কোর য়েংবিয়ু" },
  viewReportBtn:         { en: "View Report →", as: "প্ৰতিবেদন চাওক →", mn: "চুকদুনা চাবিয়ু →" },

  // Mindsnap Arcade In-Game Strings
  pickDifficulty:        { en: "Pick a difficulty to start", as: "আৰম্ভ কৰিবলৈ এটা কাঠিন্যৰ স্তৰ বাছক", mn: "শুরু তৌনবগীদমক লৈহাউ অমা চয়নবিয়ু" },
  casualMode:            { en: "Casual", as: "সহজ", mn: "সহজ" },
  focusedMode:           { en: "Focused", as: "মধ্যম", mn: "মধ্যম" },
  expertMode:            { en: "Expert", as: "কঠিন", mn: "কঠিন" },
  gamesPlayed:           { en: "Games played", as: "খেল খেলা হ'ল", mn: "লৈহাউ সানখিবা" },
  recallAccuracy:        { en: "Recall accuracy", as: "স্মৃতিৰ সঠিকতা", mn: "মনদা থম্বগী চপ চাবা" },
  bestScore:             { en: "Best score", as: "শ্ৰেষ্ঠ নম্বৰ", mn: "খ্বাইদগী ফবা স্কোর" },
  playStreak:            { en: "Play streak", as: "ধাৰাবাহিক খেল", mn: "মখা তানা লৈহাউ" },
  daySingular:           { en: "day", as: "দিন", mn: "নুমিৎ" },
  dayPlural:             { en: "days", as: "দিন", mn: "নুমিৎ" },
  memorizePattern:       { en: "MEMORIZE THE PATTERN", as: "পেটাৰ্নটো মনত ৰাখক", mn: "পেটার্ন মনদা থম্বিয়ু" },
  rebuildPattern:        { en: "REBUILD THE PATTERN", as: "পেটাৰ্নটো আকৌ সজাওক", mn: "পেটার্ন অমুক শেমগৎবিয়ু" },
  lockItIn:              { en: "Lock it in.", as: "মনত ৰাখি থওক।", mn: "মনদা চেৎনা থম্বিয়ু।" },
  yourTurn:              { en: "Your turn.", as: "আপোনাৰ পাল।", mn: "নংগী পালা।" },
  rememberGlowing:       { en: "Remember all glowing tiles.", as: "জিলিকি থকা সকলো টাইল মনত ৰাখক।", mn: "ঙাল্লিবা পেটার্ন তাইলসিং মনদা থম্বিয়ু।" },
  tapGlowing:            { en: "Tap every tile that was glowing.", as: "জিলিকি থকা টাইলবোৰত টেপ কৰক।", mn: "ঙাল্লিবা পেটার্ন তাইলসিংদা টেপ তৌবিয়ু।" },
  secondsText:           { en: "seconds", as: "ছেকেণ্ড", mn: "সেকেন্ড" },
  scoreText:             { en: "SCORE", as: "নম্বৰ", mn: "স্কোর" },
  roundText:             { en: "ROUND", as: "ৰাউণ্ড", mn: "রাউন্ড" },
  menuBack:              { en: "← Menu", as: "← মেনু", mn: "← মেনু" },
  mindsnapNavTitle:      { en: "Mindsnap Memory Arcade", as: "মাইণ্ডস্নেপ স্মৃতি আৰ্কেড", mn: "মাইন্ডস্নেপ লৈহাউ আৰ্কেড" },
  runComplete:           { en: "RUN COMPLETE", as: "খেল সম্পূৰ্ণ হ'ল", mn: "লৈহাউ লোইরে" },
  patternLocked:         { en: "Pattern locked.", as: "পেটাৰ্ন সঠিক হ'ল।", mn: "পেটার্ন চপ চারে।" },
  youHeldOwn:            { en: "You held your own.", as: "আপুনি ভাল চেষ্টা কৰিলে।", mn: "নং ফনা হোৎনখি।" },
  brainWarmingUp:        { en: "The brain is warming up.", as: "মগজু প্ৰস্তুত হৈছে।", mn: "লৌশিং শেমগৎলি।" },
  finalScore:            { en: "Final Score", as: "চূড়ান্ত নম্বৰ", mn: "অৰোইবা স্কোর" },
  hitsText:              { en: "Hits", as: "সঠিক", mn: "চপ চাব" },
  missesText:            { en: "Misses", as: "ভুল", mn: "অরানবা" },
  accuracyText:          { en: "Accuracy", as: "সঠিকতা", mn: "চপ চাব %" },
  nextRoundBtn:          { en: "NEXT ROUND ➔", as: "পৰৱৰ্তী ৰাউণ্ড ➔", mn: "মখা ৰাউণ্ড ➔" },
  changeModeBtn:         { en: "Change Mode", as: "স্তৰ সলনি কৰক", mn: "স্তৰ হোংদোকবিয়ু" },

  // Smriti Taal Arcade In-Game Strings
  smritiNavTitle:        { en: "Smriti Taal — Rhythm Arcade", as: "স্মৃতি তাল — ৰিদম আৰ্কেড", mn: "স্মৃতি তাল — ৰিদম আৰ্কেড" },
  levelLabel:            { en: "Level", as: "স্তৰ", mn: "স্তৰ" },
  rhythmMemoryTitle:     { en: "Rhythm & Memory", as: "তাল আৰু স্মৃতি", mn: "তাল অমসুং লৈহাউ" },
  rhythmMemorySub:       { en: "Listen to the instrument rhythm sequence, repeat it back, and name the first beat!", as: "বাদ্যযন্ত্ৰৰ শব্দ আৰু তাল মনত ৰাখক, আকৌ বজায়ক আৰু প্ৰথম শব্দটো বাছক!", mn: "শব্দ অমসুং তাল মনদা থম্বিয়ু, হন্না বাজাইবিয়ু অমসুং অহৌবা শব্দ চয়নবিয়ু!" },
  bestStreakLabel:       { en: "Best streak", as: "শ্ৰেষ্ঠ ধাৰাবাহিকতা", mn: "খ্বাইদগী ফবা মখা" },
  currentLevelLabel:     { en: "Current Level", as: "বৰ্তমান স্তৰ", mn: "হউজিক স্তৰ" },
  roundsSessionLabel:    { en: "Rounds/session", as: "ৰাউণ্ড/ছেচন", mn: "রাউন্ড/সেসন" },
  startPlayingBtn:       { en: "Start Playing ➔", as: "খেলা আৰম্ভ কৰক ➔", mn: "লৈহাউ শুরু তৌবিয়ু ➔" },
  homeBack:              { en: "← Home", as: "← ঘৰ", mn: "← ইমুং" },
  listenCarefully:       { en: "Listen carefully to the rhythm...", as: "মন দি তাল শুনক...", mn: "তাল চপ চানা তাবিয়ু..." },
  nowRepeatSeq:          { en: "Now repeat the sequence!", as: "এতিয়া ক্ৰমটো আকৌ বজায়ক!", mn: "হউজিক ক্রমান্বয়ে হন্না বাজাইবিয়ু!" },
  hearAgainBtn:          { en: "🔊 Hear sequence again", as: "🔊 ক্ৰমটো আকৌ শুনক", mn: "🔊 হন্না তাবিয়ু" },
  whichPlayedFirst:      { en: "Which instrument played FIRST?", as: "কোনটো বাদ্য প্ৰথমে বাজিছিল?", mn: "কদোইবা শব্দ অহৌবাদা বাজখিবা?" },
  tapCorrectInst:        { en: "Tap the correct instrument below to complete the round.", as: "ৰাউণ্ড সম্পূৰ্ণ কৰিবলৈ শুদ্ধ বাদ্যযন্ত্ৰত টেপ কৰক।", mn: "রাউন্ড লোইনবগীদমক চপ চাবা শব্দদা টেপ তৌবিয়ু।" },
  sessionComplete:       { en: "SESSION COMPLETE", as: "ছেচন সম্পূৰ্ণ হ'ল", mn: "সেসন লোইরে" },
  wonderfulRhythm:       { en: "Wonderful rhythm performance!", as: "বৰ সুন্দৰ তাল আৰু স্মৃতি!", mn: "ফজরবা তাল অমসুং লৈহাউ!" },
  goodPractice:          { en: "Good practice today!", as: "আজি বহুত ভাল অভ্যাস হ'ল!", mn: "ফজথা ফবা লৈহাউ অইরে!" },
  totalAccuracy:         { en: "TOTAL ACCURACY", as: "মুঠ সঠিকতা", mn: "পুম্বা চপ চাব" },
  roundsPassed:          { en: "Rounds passed", as: "উত্তীৰ্ণ ৰাউণ্ড", mn: "মায় পাকপা রাউন্ড" },
  roundTimeline:         { en: "Round Timeline", as: "ৰাউণ্ডৰ সময়ৰেখা", mn: "রাউন্ড টাইমলাইন" },
  playAgainBtn:          { en: "PLAY AGAIN ➔", as: "আকৌ খেলক ➔", mn: "হন্না লৈহাউ ➔" },
  backToMenuBtn:         { en: "Back to menu", as: "মেনুলৈ ঘূৰি যাওক", mn: "মেনুদা হনবিয়ু" },

  // Sanga Memory & Recall In-Game Strings
  sangaNavTitle:         { en: "Sanga Memory & Recall", as: "শাংগা স্মৃতি আৰু পুনৰুদ্ধাৰ", mn: "শা-ঙা লৈহাউ অমসুং সোংথিং" },
  sangaHeroSub:          { en: "Train your memory with calm object cards, missing items, position grids, and pattern recall!", as: "বস্তু, নোহোৱা বস্তু, স্থান আৰু পেটাৰ্নৰ সৈতে স্মৃতিৰ অভ্যাস কৰক!", mn: "পোত-চৈ, ক্যাটেগরি অমসুং পেটার্ন মনদা থম্বগী শান্ত লৈহাউ!" },
  difficultyAutoText:    { en: "Difficulty advances automatically as your accuracy sharpens!", as: "আপোনাৰ সঠিকতা বাঢ়িলে কাঠিন্য স্বয়ংক্ৰিয়ভাৱে বাঢ়িব!", mn: "নংগী চপ চাব মখা তানবগা লোয়ননা স্তৰ মরোমদোম শেমগৎকনি!" },
  questionsPerRound:     { en: "Questions / Round", as: "প্ৰশ্ন / ৰাউণ্ড", mn: "ৱাহং / রাউন্ড" },
  startPracticeBtn:      { en: "Start Practice ➔", as: "অভ্যাস আৰম্ভ কৰক ➔", mn: "অভ্যাস শুরু তৌবিয়ু ➔" },
  resetLevelBtn:         { en: "🔄 Reset Level & Streaks to Level 1", as: "🔄 স্তৰ ১ লৈ পুনৰ ছেট কৰক", mn: "🔄 স্তৰ ১ দা অমুক শেমগৎবিয়ু" },
  exitBtn:               { en: "← Exit", as: "← ওলাই যাওক", mn: "← থাদোকবিয়ু" },
  streakBadge:           { en: "Streak!", as: "ধাৰাবাহিকতা!", mn: "মখা!" },
  lookCarefully:         { en: "Look carefully at the pictures!", as: "ছবিত মন দি চাওক!", mn: "ছবিদা চপ চানা য়েংবিয়ু!" },
  readAloudBtn:          { en: "🔊 Read aloud", as: "🔊 শব্দ কৰি পঢ়ক", mn: "🔊 পাবিয়ু" },
  excellentRemembered:   { en: "🌿 Excellent! You remembered correctly!", as: "🌿 সুন্দৰ! আপুনি সঠিকভাৱে মনত ৰাখিলে!", mn: "🌿 ফজরবা! নং চপ চানা মনদা থমখি!" },
  notQuiteTryNext:       { en: "🙂 Not quite! Let's try the next one.", as: "🙂 প্ৰায় হ'ল! আহক পৰৱৰ্তীটো চেষ্টা কৰোঁ।", mn: "🙂 চপ চাদে! মখা লৈহাউদা হোৎনবিয়ু।" },
  practiceComplete:      { en: "PRACTICE COMPLETE", as: "অভ্যাস সম্পূৰ্ণ হ'ল", mn: "অভ্যাস লোইরে" },
  greatMemoryPerf:       { en: "Great memory performance!", as: "বৰ সুন্দৰ স্মৃতি প্ৰদৰ্শন!", mn: "ফজরবা লৈহাউ উৎখিবা!" },
  wellPracticedToday:    { en: "Well practiced today!", as: "আজি ভাল অভ্যাস হ'ল!", mn: "ফজথা ফবা লৈহাউ অইরে!" },
  levelUpReached:        { en: "⭐ Level Up! Reached Level", as: "⭐ স্তৰ বৃদ্ধি! আপুনি পাইছে স্তৰ", mn: "⭐ স্তৰ শেমগৎলে! নংগী স্তৰ" },
  finalAccuracy:         { en: "FINAL ACCURACY", as: "চূড়ান্ত সঠিকতা", mn: "অৰোইবা চপ চাব" },
  questionsCorrect:      { en: "questions correct", as: "প্ৰশ্ন শুদ্ধ হ'ল", mn: "ৱাহং চপ চারে" },

  // Match Pairs & General In-Game Strings
  movesLabel:            { en: "Moves", as: "চাল", mn: "খোংথাং" },
  restartBtn:            { en: "Restart", as: "আকৌ আৰম্ভ কৰক", mn: "হন্না শুরু তৌবিয়ু" },
  matchedAllPairs:       { en: "🎉 Wonderful Job! You matched all pairs!", as: "🎉 বহুত সুন্দৰ! আপুনি সকলো যোৰ মিলালে!", mn: "🎉 ফজরবা থবক! নং পুম্বা পেয়ার মিলহল্লে!" },
  totalScore:            { en: "Total Score", as: "মুঠ নম্বৰ", mn: "পুম্বা স্কোর" },
  scoreLabel:            { en: "Score", as: "নম্বৰ", mn: "স্কোর" },
  confirmResetLevel:     { en: "Do you want to reset your level back to Level 1 and clear your best streak?", as: "আপুনি আপোনাৰ স্তৰ ১ লৈ পুনৰ ছেট কৰিব বিচাৰেনে?", mn: "নং স্তৰ ১ দা অমুক শেমগৎবা পাম্বরা?" },
};

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });

export type UserProfile = {
  id?: number;
  name: string;
  email: string;
  phone: string;
  age: string;
  language?: string;
  careCode?: string;
  emergencyContact?: string;
  avatar?: string;
  role?: string;
};

const UserContext = createContext<{
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}>({
  user: { name: "", email: "", phone: "", age: "" },
  setUser: () => {},
});

function useLang() { return useContext(LangContext); }
function useUser() { return useContext(UserContext); }
function useT() {
  const { lang } = useLang();
  return (key: string) => TRANSLATIONS[key]?.[lang] ?? TRANSLATIONS[key]?.["en"] ?? key;
}

// ── Avatar System ─────────────────────────────────────────────────────────

const PRESET_AVATARS: Record<string, { label: string; emoji: string; bg: string }> = {
  "avatar-1": { label: "Grandpa", emoji: "👴", bg: "#2E6F6E" },
  "avatar-2": { label: "Grandma", emoji: "👵", bg: "#7A9B76" },
  "avatar-3": { label: "Lotus", emoji: "🌸", bg: "#C1613D" },
  "avatar-4": { label: "Leaf", emoji: "🌿", bg: "#8B5CA8" },
  "avatar-5": { label: "Tea", emoji: "🍵", bg: "#D9A441" },
  "avatar-6": { label: "Peacock", emoji: "🦚", bg: "#2E6F6E" },
};

function UserAvatar({
  avatar,
  name,
  size = 48,
  className = "",
}: {
  avatar?: string | null;
  name?: string;
  size?: number;
  className?: string;
}) {
  if (avatar && (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("data:image"))) {
    return (
      <img
        src={avatar}
        alt={name || "Profile"}
        className={`rounded-full object-cover shadow-md border-2 border-white flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const presetKey = avatar && PRESET_AVATARS[avatar] ? avatar : "avatar-1";
  const preset = PRESET_AVATARS[presetKey];
  const initials = name ? name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : null;

  return (
    <div
      className={`rounded-full flex items-center justify-center font-black text-white shadow-md border-2 border-white flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: preset.bg,
        fontSize: Math.round(size * 0.45),
      }}
    >
      {initials || preset.emoji}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function IconMic({ size = 32, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  );
}

function IconPuzzle({ size = 36, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 11h-1a1 1 0 0 1-1-1V8a1 1 0 0 0-1-1h-2a1 1 0 0 1-1-1V5a2.5 2.5 0 0 0-5 0v1a1 1 0 0 1-1 1H6a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1H3a2.5 2.5 0 0 0 0 5h1a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 1 1 1v1a2.5 2.5 0 0 0 5 0v-1a1 1 0 0 1 1-1h2a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1h1a2.5 2.5 0 0 0 0-5z" />
    </svg>
  );
}

function IconPill({ size = 28, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 20.5l-7-7a5 5 0 0 1 7.07-7.07l7 7a5 5 0 0 1-7.07 7.07z" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
    </svg>
  );
}

function IconDroplet({ size = 28, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function IconBowl({ size = 28, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11h16a8 8 0 0 1-16 0z" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function IconCalendar({ size = 28, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconVolume({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function IconCheck({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconTrash({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function ConfirmDeleteModal({
  title = "Delete Reminder?",
  message = "Are you sure you want to delete this reminder?",
  onClose,
  onConfirm,
}: {
  title?: string;
  message?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#FAF6EF] rounded-3xl p-6 flex flex-col gap-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[22px] font-black text-[#2B2B2B]">{title}</h3>
        <p className="text-[15px] font-medium text-[#7A7060]">{message}</p>
        <div className="flex gap-3 mt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-[#D6C9B4] text-[#7A7060] font-bold">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-[#C1613D] text-white font-bold shadow-md">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ReminderIcon({ type, size, color }: { type: string; size: number; color: string }) {
  if (type === "medicine" || type === "pill") return <IconPill size={size} color={color} />;
  if (type === "water" || type === "droplet") return <IconDroplet size={size} color={color} />;
  if (type === "meal" || type === "bowl") return <IconBowl size={size} color={color} />;
  return <IconCalendar size={size} color={color} />;
}

function BambooStrip() {
  return (
    <div className="w-full h-1.5 flex flex-shrink-0" style={{ backgroundColor: "#2E6F6E" }}>
      <div className="w-1/4 h-full bg-[#D9A441]" />
      <div className="w-1/4 h-full bg-[#7A9B76]" />
      <div className="w-1/4 h-full bg-[#C1613D]" />
      <div className="w-1/4 h-full bg-[#8B5CA8]" />
    </div>
  );
}

function NavBar({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-[#2E6F6E] text-white flex-shrink-0">
      {onBack && (
        <button onClick={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/10 active:bg-white/20">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      <h2 className="text-[22px] font-black tracking-wide flex-1">{title}</h2>
    </div>
  );
}

// ── Screen 1: Onboarding (Language Picker) ─────────────────────────────────

function OnboardingScreen({ onContinue }: { onContinue: () => void }) {
  const { lang, setLang } = useLang();
  const t = useT();

  return (
    <div className="flex flex-col min-h-full bg-[#FAF6EF]">
      <BambooStrip />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-md mx-auto w-full gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: "#2E6F6E" }}>
            <span className="font-serif text-[48px] font-bold text-[#FAF6EF]">স্</span>
          </div>
          <h1 className="text-[36px] font-black text-[#2B2B2B] tracking-tight">Smriti</h1>
          <p className="text-[17px] text-[#7A7060] font-medium text-center">Assam &amp; Northeast Dementia Care</p>
        </div>

        {/* Language picker */}
        <div className="w-full flex flex-col gap-3">
          <p className="text-[16px] font-bold text-[#2B2B2B] uppercase tracking-wider text-center">{t("chooseLanguage")}</p>
          {([
            { code: "en", label: "English", sub: "Default language" },
            { code: "as", label: "অসমীয়া", sub: "Assamese" },
            { code: "mn", label: "মৈতৈলোন্", sub: "Manipuri" },
          ] as { code: Lang; label: string; sub: string }[]).map((item) => (
            <button
              key={item.code}
              onClick={() => setLang(item.code)}
              className="flex items-center justify-between px-6 py-5 rounded-2xl border-2 transition-all duration-200"
              style={{
                backgroundColor: lang === item.code ? "#EBF4F4" : "#FFFFFF",
                borderColor: lang === item.code ? "#2E6F6E" : "#D6C9B4",
                boxShadow: lang === item.code ? "0 4px 16px rgba(46,111,110,0.15)" : "none",
              }}
            >
              <div className="flex flex-col items-start">
                <span className="text-[22px] font-bold text-[#2B2B2B]">{item.label}</span>
                <span className="text-[14px] font-semibold text-[#A09080]">{item.sub}</span>
              </div>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center border-2"
                style={{
                  borderColor: lang === item.code ? "#2E6F6E" : "#D6C9B4",
                  backgroundColor: lang === item.code ? "#2E6F6E" : "transparent",
                }}
              >
                {lang === item.code && <IconCheck size={16} color="white" />}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onContinue}
          className="w-full rounded-2xl py-5 text-[22px] font-black transition-all active:scale-[0.98] mt-2"
          style={{ backgroundColor: "#2E6F6E", color: "#FFFFFF", boxShadow: "0 4px 20px rgba(46,111,110,0.3)" }}
        >
          {t("continue")}
        </button>
      </div>
      <BambooStrip />
    </div>
  );
}

function LanguageDropdown({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const LANGUAGES: { code: Lang; label: string; sub: string; flag: string }[] = [
    { code: "en", label: "English", sub: "Default", flag: "🇬🇧" },
    { code: "as", label: "অসমীয়া", sub: "Assamese", flag: "🇮🇳" },
    { code: "mn", label: "মৈতৈলোন্", sub: "Manipuri", flag: "🇮🇳" },
  ];

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-extrabold text-[13px] border border-white/30 backdrop-blur-sm transition-all active:scale-95 shadow-sm"
        title="Change Language"
      >
        <span>{currentLang.code.toUpperCase()}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Floating Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#D6C9B4] py-2 z-50 overflow-hidden">
            <div className="px-4 py-1.5 text-[11px] font-black uppercase text-[#7A7060] tracking-wider border-b border-[#F0E8DC]">
              Select Language
            </div>
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setLang(item.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                  lang === item.code ? "bg-[#EBF4F4] text-[#2E6F6E] font-extrabold" : "hover:bg-[#FAF6EF] text-[#2B2B2B] font-bold"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[16px]">{item.flag}</span>
                  <div>
                    <p className="text-[15px] leading-tight">{item.label}</p>
                    <p className="text-[11px] opacity-70 font-semibold">{item.sub}</p>
                  </div>
                </div>
                {lang === item.code && (
                  <div className="w-5 h-5 rounded-full bg-[#2E6F6E] flex items-center justify-center text-white text-[10px] font-black">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Screen 2: Home Dashboard ───────────────────────────────────────────────

function HomeScreen({ onNavigate }: { onNavigate: (screen: Screen) => void; onSettings?: () => void }) {
  const t = useT();
  const { lang, setLang } = useLang();
  const { user, setUser } = useUser();
  const [reminders, setReminders] = useState<api.ApiReminder[]>([]);

  useEffect(() => {
    api.fetchPatientProfile()
      .then((p) => {
        setUser((prev) => ({
          ...prev,
          id: p.id,
          name: p.name,
          email: p.email || "",
          phone: p.phone,
          age: String(p.age || ""),
          language: p.language,
          careCode: p.careCode,
          emergencyContact: p.emergencyContact || "",
          avatar: p.avatar || "avatar-1",
        }));
      })
      .catch(() => {});

    api.fetchMyReminders()
      .then(setReminders)
      .catch(() => {
        // Fallback if not connected or loading error
      });

    const unsubscribe = subscribeSync((payload) => {
      if (payload.entity === "reminder") {
        if (payload.action === "created") {
          setReminders((prev) => [payload.data, ...prev.filter((r) => r.id !== payload.data.id)]);
        } else if (payload.action === "updated") {
          setReminders((prev) => prev.map((r) => (r.id === payload.data.id ? { ...r, ...payload.data } : r)));
        } else if (payload.action === "deleted") {
          setReminders((prev) => prev.filter((r) => r.id !== payload.data.id));
        }
      } else if (payload.entity === "patient_profile" && payload.action === "updated") {
        const p = payload.data;
        setUser((prev) => ({
          ...prev,
          name: p.name || prev.name,
          phone: p.phone || prev.phone,
          email: p.email ?? prev.email,
          age: String(p.age ?? prev.age),
          language: p.language || prev.language,
          avatar: p.avatar || prev.avatar,
        }));
      }
    });
    return unsubscribe;
  }, []);

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "goodMorning" : hour < 17 ? "goodAfternoon" : "goodEvening";
  const displayName = typeof user.name === "string" && user.name.trim() ? user.name.trim() : "Friend";

  return (
    <div className="flex flex-col min-h-full bg-[#FAF6EF]">
      <BambooStrip />
      
      {/* Teal Hero Header */}
      <div className="bg-[#2E6F6E] px-6 pt-6 pb-4 text-white flex flex-col gap-6 relative">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[26px] font-black leading-tight text-white">{t(greetingKey)},</h2>
            <p className="text-[15px] font-bold text-white/80 mt-0.5">{displayName}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive Language Dropdown */}
            <LanguageDropdown lang={lang} setLang={setLang} />

            {/* Profile Avatar */}
            <button
              onClick={() => onNavigate("profile")}
              className="transition-transform active:scale-95 flex-shrink-0"
              title="My Profile"
            >
              <UserAvatar avatar={user.avatar} name={user.name} size={44} />
            </button>
          </div>
        </div>

        {/* Featured Card: Talk to Smriti */}
        <button
          onClick={() => onNavigate("smriti")}
          className="bg-white rounded-3xl p-5 shadow-xl flex items-center justify-between cursor-pointer w-full text-left transition-transform active:scale-[0.98] border border-white/50"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2E6F6E] text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <IconMic size={30} color="white" />
            </div>
            <div>
              <p className="text-[22px] font-black text-[#2B2B2B] leading-tight">{t("talkSmriti")}</p>
              <p className="text-[14px] font-bold text-[#7A7060] mt-0.5">{t("aiCompanion")}</p>
            </div>
          </div>

          <div className="w-3.5 h-3.5 rounded-full bg-[#7A9B76] flex-shrink-0 shadow-sm" title="Online" />
        </button>
      </div>

      {/* Organic Wave Transition */}
      <div className="w-full overflow-hidden leading-none -mb-1 bg-[#2E6F6E]">
        <svg className="relative block w-full h-10 text-[#FAF6EF]" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="currentColor">
          <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,60 L1200,120 L0,120 Z"></path>
        </svg>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 pt-2 pb-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {/* 3-Cards Row Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Card 1: Play & Remember */}
          <button
            onClick={() => onNavigate("games")}
            className="flex flex-col items-center justify-between p-4 rounded-3xl text-center transition-all duration-200 active:scale-95 min-h-[145px] shadow-sm"
            style={{ backgroundColor: "#EBF4F4", border: "1.5px solid #2E6F6E30" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#2E6F6E] text-white shadow-sm mb-2">
              <IconPuzzle size={26} color="white" />
            </div>
            <div>
              <p className="text-[15px] font-black text-[#2B2B2B] leading-tight">{t("playRemember")}</p>
              <p className="text-[12px] font-bold text-[#2E6F6E] mt-1">{t("memoryGames")}</p>
            </div>
          </button>

          {/* Card 2: Daily Chit Chat */}
          <button
            onClick={() => onNavigate("chitchat")}
            className="flex flex-col items-center justify-between p-4 rounded-3xl text-center transition-all duration-200 active:scale-95 min-h-[145px] shadow-sm"
            style={{ backgroundColor: "#F3EDF8", border: "1.5px solid #8B5CA830" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#8B5CA8] text-white shadow-sm mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-black text-[#2B2B2B] leading-tight">{t("chitChat")}</p>
              <p className="text-[12px] font-bold text-[#8B5CA8] mt-1">{t("chitChatSub")}</p>
            </div>
          </button>

          {/* Card 3: Call Family */}
          <button
            onClick={() => {
              const targetPhone = user.emergencyContact || "+919876543210";
              window.open(`tel:${targetPhone.replace(/[^0-9+]/g, "")}`);
            }}
            className="flex flex-col items-center justify-between p-4 rounded-3xl text-center transition-all duration-200 active:scale-95 min-h-[145px] shadow-sm"
            style={{ backgroundColor: "#EEF4EE", border: "1.5px solid #7A9B7630" }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#7A9B76] text-white shadow-sm mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-black text-[#2B2B2B] leading-tight">{t("callFamily")}</p>
              <p className="text-[12px] font-bold text-[#7A9B76] mt-1">{t("familyNames")}</p>
            </div>
          </button>
        </div>

        {/* Today's Reminders List */}
        <div className="flex flex-col rounded-3xl overflow-hidden bg-white shadow-sm" style={{ border: "1.5px solid #D6C9B4" }}>
          <div className="flex items-center justify-between px-5 py-3.5" style={{ backgroundColor: "#F1ECE0" }}>
            <p className="text-[13px] font-black text-[#2B2B2B] uppercase tracking-wider">{t("todayReminders")}</p>
            <button onClick={() => onNavigate("reminders")} className="text-[13px] font-black uppercase text-[#2E6F6E] hover:underline">
              {t("seeAll")}
            </button>
          </div>
          {reminders.length === 0 ? (
            <div className="p-5 text-center text-[#A09080] text-[15px] font-semibold bg-[#FAF6EF]">
              No reminders scheduled for today.
            </div>
          ) : (
            reminders.slice(0, 4).map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{
                  backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#FAF6EF",
                  borderTop: "1px solid #D6C9B430",
                  opacity: r.isCompleted ? 0.6 : 1,
                }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EBF4F4" }}>
                  <ReminderIcon type={r.category} size={18} color="#2E6F6E" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-black text-[#2B2B2B] leading-tight" style={{ textDecoration: r.isCompleted ? "line-through" : "none" }}>{r.title}</p>
                  <p className="text-[13px] font-semibold text-[#2E6F6E]">{r.time}</p>
                </div>
                {r.isCompleted && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[#7A9B76]">
                    <IconCheck size={14} color="white" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <BambooStrip />
    </div>
  );
}

// ── Screen 3: Games Hub ───────────────────────────────────────────────────

function GamesScreen({ onNavigate, onBack }: { onNavigate: (screen: Screen) => void; onBack: () => void }) {
  const t = useT();
  const [showProgressModal, setShowProgressModal] = useState(false);

  return (
    <div className="flex flex-col min-h-full bg-[#FAF6EF]">
      <BambooStrip />
      <NavBar title={t("playRemember")} onBack={onBack} />
      {showProgressModal && <PatientProgressReportModal onClose={() => setShowProgressModal(false)} />}
      
      <div className="flex-1 px-6 py-6 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {/* Progress Report Banner */}
        <div className="bg-gradient-to-r from-[#2E6F6E] to-[#1E4D4C] text-white p-5 rounded-3xl shadow-sm flex items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-black">{t("allTimeProgressReport")}</h4>
            <p className="text-xs font-semibold text-emerald-100 mt-0.5">{t("trackAccuracyScore")}</p>
          </div>
          <button
            onClick={() => setShowProgressModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-white text-[#2E6F6E] font-black text-xs shadow-sm hover:bg-emerald-50 transition-all cursor-pointer flex-shrink-0"
          >
            {t("viewReportBtn")}
          </button>
        </div>

        {/* Game 1: Match the Pairs */}
        <button
          onClick={() => onNavigate("game")}
          className="flex items-center gap-5 p-5 rounded-3xl border-2 text-left bg-white transition-all active:scale-[0.98]"
          style={{ borderColor: "#2E6F6E40", boxShadow: "0 4px 16px rgba(46,111,110,0.08)" }}
        >
          <img src={matchPairsThumbnail} alt="Match pairs" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-[22px] font-black text-[#2B2B2B]">{t("matchPairs")}</h3>
            <p className="text-[15px] font-semibold text-[#7A7060] mt-1">{t("matchPairsDesc")}</p>
          </div>
        </button>

        {/* Game 2: Mindsnap Memory Arcade */}
        <button
          onClick={() => onNavigate("mindsnap")}
          className="flex items-center gap-5 p-5 rounded-3xl border-2 text-left bg-white transition-all active:scale-[0.98]"
          style={{ borderColor: "#7567f840", boxShadow: "0 4px 16px rgba(117,103,248,0.08)" }}
        >
          <img src={mindsnapThumbnail} alt="Mindsnap Arcade" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-[#7567f820] shadow-sm" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[22px] font-black text-[#2B2B2B]">{t("mindsnapTitle")}</h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#e7e5ff] text-[#7567f8] px-2.5 py-0.5 rounded-full">{t("popularTag")}</span>
            </div>
            <p className="text-[15px] font-semibold text-[#7A7060] mt-1">{t("mindsnapDesc")}</p>
          </div>
        </button>

        {/* Game 3: Smriti Taal Rhythm & Memory */}
        <button
          onClick={() => onNavigate("smrititaal")}
          className="flex items-center gap-5 p-5 rounded-3xl border-2 text-left bg-white transition-all active:scale-[0.98]"
          style={{ borderColor: "#2F6B6240", boxShadow: "0 4px 16px rgba(47,107,98,0.08)" }}
        >
          <img src={smrititaalThumbnail} alt="Smriti Taal" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-[#2F6B6220] shadow-sm" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[22px] font-black text-[#2B2B2B]">{t("smritiTaalTitle")}</h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#E2EFEB] text-[#2F6B62] px-2.5 py-0.5 rounded-full">{t("newTag")}</span>
            </div>
            <p className="text-[15px] font-semibold text-[#7A7060] mt-1">{t("smritiTaalDesc")}</p>
          </div>
        </button>

        {/* Game 4: Sanga Memory & Recall */}
        <button
          onClick={() => onNavigate("sanga")}
          className="flex items-center gap-5 p-5 rounded-3xl border-2 text-left bg-white transition-all active:scale-[0.98]"
          style={{ borderColor: "#2F6B4F40", boxShadow: "0 4px 16px rgba(47,107,79,0.08)" }}
        >
          <img src={sangaThumbnail} alt="Sanga Memory" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-[#2F6B4F20] shadow-sm" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[22px] font-black text-[#2B2B2B]">{t("sangaTitle")}</h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#EAEEE1] text-[#2F6B4F] px-2.5 py-0.5 rounded-full">{t("newTag")}</span>
            </div>
            <p className="text-[15px] font-semibold text-[#7A7060] mt-1">{t("sangaDesc")}</p>
          </div>
        </button>
      </div>

      <BambooStrip />
    </div>
  );
}

// ── Screen 4: Memory Game ──────────────────────────────────────────────────

function MemoryGameScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const CARDS = [
    { id: 1, symbol: "🌸", name: "Flower" },
    { id: 2, symbol: "🦚", name: "Peacock" },
    { id: 3, symbol: "🍵", name: "Tea" },
    { id: 4, symbol: "🐘", name: "Elephant" },
  ];

  const [deck, setDeck] = useState<{ uid: number; symbol: string; name: string }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  function resetGame() {
    const doubled = [...CARDS, ...CARDS].map((c, i) => ({ ...c, uid: i }));
    for (let i = doubled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
    }
    setDeck(doubled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setWon(false);
  }

  useEffect(() => { resetGame(); }, []);

  function handleCardClick(index: number) {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = nextFlipped;
      if (deck[first].symbol === deck[second].symbol) {
        const nextMatched = [...matched, first, second];
        setMatched(nextMatched);
        setFlipped([]);
        if (nextMatched.length === deck.length) {
          setWon(true);
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-[#FAF6EF]">
      <BambooStrip />
      <NavBar title={t("matchPairs")} onBack={onBack} />
      <div className="flex-1 px-6 py-6 flex flex-col items-center gap-6 max-w-md mx-auto w-full">
        <div className="flex items-center justify-between w-full">
          <span className="text-[18px] font-bold text-[#2B2B2B]">{t("movesLabel")}: {moves}</span>
          <button onClick={resetGame} className="px-4 py-2 bg-[#EEF4EE] border border-[#7A9B7640] text-[#2E6F6E] rounded-xl font-bold">
            {t("restartBtn")}
          </button>
        </div>

        {won && (
          <div className="w-full text-center p-4 bg-[#EEF4EE] border border-[#7A9B76] rounded-2xl text-[#2E6F6E] font-extrabold text-[20px]">
            {t("matchedAllPairs")}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 w-full">
          {deck.map((card, i) => {
            const isFlipped = flipped.includes(i) || matched.includes(i);
            return (
              <button
                key={i}
                onClick={() => handleCardClick(i)}
                className="aspect-square rounded-2xl flex items-center justify-center text-3xl font-bold border-2 transition-all shadow-sm active:scale-95"
                style={{
                  backgroundColor: isFlipped ? "#FFFFFF" : "#2E6F6E",
                  borderColor: isFlipped ? "#D6C9B4" : "#2E6F6E",
                }}
              >
                {isFlipped ? card.symbol : "❓"}
              </button>
            );
          })}
        </div>
      </div>
      <BambooStrip />
    </div>
  );
}

// ── Screen 4B: Mindsnap Arcade Game ───────────────────────────────────────

type MindsnapModeId = "casual" | "focused" | "expert";

interface MindsnapMode {
  name: string;
  tag: string;
  icon: string;
  grid: number;
  targets: number;
  rounds: number;
  seconds: number;
  color: string;
  copy: string;
}

const MINDSNAP_THEME = {
  ink: "#171329",
  violet: "#7567f8",
  cyan: "#56d8d0",
  pink: "#ff6fae",
  yellow: "#ffd166",
  bg: "#f6f7fc",
  card: "#ffffff",
  muted: "#77748a",
  line: "#e7e5f0",
  good: "#3bc58a",
  bad: "#ff6b6b",
};

const MINDSNAP_MODES: Record<MindsnapModeId, MindsnapMode> = {
  casual: { name: "Casual", tag: "WARM UP", icon: "🌱", grid: 3, targets: 3, rounds: 3, seconds: 4, color: MINDSNAP_THEME.cyan, copy: "" },
  focused: { name: "Focused", tag: "MOST PLAYED", icon: "⭐", grid: 4, targets: 5, rounds: 4, seconds: 3, color: MINDSNAP_THEME.violet, copy: "" },
  expert: { name: "Expert", tag: "NO MERCY", icon: "🏆", grid: 5, targets: 7, rounds: 5, seconds: 2, color: MINDSNAP_THEME.pink, copy: "" },
};

interface MindsnapStats {
  games: number;
  best: number;
  hits: number;
  attempts: number;
  streak: number;
  lastPlayed: string | null;
}

const DEFAULT_MINDSNAP_STATS: MindsnapStats = { games: 0, best: 0, hits: 0, attempts: 0, streak: 0, lastPlayed: null };

const loadMindsnapStats = (): MindsnapStats => {
  try {
    return { ...DEFAULT_MINDSNAP_STATS, ...JSON.parse(localStorage.getItem("mindsnap-stats") || "{}") };
  } catch {
    return DEFAULT_MINDSNAP_STATS;
  }
};

const persistMindsnapStats = (value: MindsnapStats) => {
  try {
    localStorage.setItem("mindsnap-stats", JSON.stringify(value));
  } catch {}
};

function MindsnapScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const [screen, setScreen] = useState<"home" | "game" | "results">("home");
  const [mode, setMode] = useState<MindsnapModeId>("focused");
  const [round, setRound] = useState(1);
  const [targets, setTargets] = useState<number[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [roundHits, setRoundHits] = useState(0);
  const [result, setResult] = useState<{ score: number; hits: number; misses: number } | null>(null);
  const [stats, setStats] = useState<MindsnapStats>(loadMindsnapStats);

  const config = MINDSNAP_MODES[mode];

  const shuffle = (items: number[]) => [...items].sort(() => Math.random() - 0.5);
  const percent = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  const createPattern = useCallback((id: MindsnapModeId, number: number) => {
    const chosen = MINDSNAP_MODES[id];
    const cells = shuffle(Array.from({ length: chosen.grid * chosen.grid }, (_, i) => i)).slice(0, chosen.targets);
    setMode(id);
    setRound(number);
    setTargets(cells);
    setPicked([]);
    setRevealed(true);
    setSeconds(chosen.seconds);
    setScreen("game");
  }, []);

  useEffect(() => {
    if (!revealed || screen !== "game") return;
    if (seconds <= 0) {
      setRevealed(false);
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [revealed, screen, seconds]);

  useEffect(() => {
    if (screen !== "game" || revealed || picked.length !== config.targets) return;
    const delay = setTimeout(() => {
      const roundScore = Math.max(0, config.targets * 100 - misses * 30);
      const newScore = score + roundScore;
      const newHits = roundHits + config.targets;
      if (round < config.rounds) {
        setScore(newScore);
        setRoundHits(newHits);
        createPattern(mode, round + 1);
      } else {
        const final = { score: newScore, hits: newHits, misses };
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = stats.lastPlayed && Date.parse(today) - Date.parse(stats.lastPlayed) === 86400000;
        const fresh = {
          ...stats,
          games: stats.games + 1,
          best: Math.max(stats.best, newScore),
          hits: stats.hits + newHits,
          attempts: stats.attempts + newHits + misses,
          streak: stats.lastPlayed === today ? stats.streak : yesterday ? stats.streak + 1 : 1,
          lastPlayed: today,
        };
        setResult(final);
        setStats(fresh);
        persistMindsnapStats(fresh);
        setScreen("results");

        // Log game activity to backend API
        const accuracy = percent(newHits, newHits + misses);
        api.logActivity("game", { game: "Mindsnap", score: newScore, accuracy, mode: config.name }).catch(() => {});
      }
    }, 550);
    return () => clearTimeout(delay);
  }, [picked, revealed, screen]);

  const start = (id: MindsnapModeId) => {
    setScore(0);
    setMisses(0);
    setRoundHits(0);
    setResult(null);
    createPattern(id, 1);
  };

  const pick = (cell: number) => {
    if (targets.includes(cell)) {
      setPicked((p) => [...p, cell]);
      setScore((s) => s + 10);
    } else {
      setMisses((m) => m + 1);
    }
  };

  const home = () => {
    setScreen("home");
    setResult(null);
  };

  const accuracy = percent(stats.hits, stats.attempts);

  const getModeLabel = (mId: MindsnapModeId) => {
    if (mId === "casual") return t("casualMode");
    if (mId === "focused") return t("focusedMode");
    return t("expertMode");
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f6f7fc] text-[#171329]">
      <BambooStrip />
      <NavBar title={t("mindsnapNavTitle")} onBack={onBack} />

      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        {screen === "home" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Header Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#171329]">{t("pickDifficulty")}</h2>
            </div>

            {/* Senior-Friendly Difficulty Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {(Object.entries(MINDSNAP_MODES) as [MindsnapModeId, MindsnapMode][]).map(([id, modeConfig]) => {
                const themeMap = {
                  casual: {
                    borderColor: "border-[#9ed5cd]",
                    cardBg: "bg-[#f2f9f8]",
                    titleColor: "text-[#1d524c]",
                    arrowColor: "text-[#236b63]",
                    arrowBorder: "border-[#b6e4de]",
                    badgeBg: "bg-[#059669]",
                    image: mindsnapCasualImg,
                  },
                  focused: {
                    borderColor: "border-[#b5bef0]",
                    cardBg: "bg-[#f3f5fc]",
                    titleColor: "text-[#273059]",
                    arrowColor: "text-[#394680]",
                    arrowBorder: "border-[#cad2f5]",
                    badgeBg: "bg-[#4f46e5]",
                    image: mindsnapFocusedImg,
                  },
                  expert: {
                    borderColor: "border-[#f2c4cb]",
                    cardBg: "bg-[#fcf4f5]",
                    titleColor: "text-[#5e2731]",
                    arrowColor: "text-[#7a2f3d]",
                    arrowBorder: "border-[#f8d7dc]",
                    badgeBg: "bg-[#e11d48]",
                    image: mindsnapExpertImg,
                  },
                }[id];

                return (
                  <button
                    key={id}
                    onClick={() => start(id)}
                    className={`rounded-3xl border-2 ${themeMap.borderColor} ${themeMap.cardBg} p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 group flex flex-col justify-between cursor-pointer w-full text-left min-h-[140px] sm:min-h-[155px]`}
                  >
                    {/* Top Row: Icon Image Badge (Left) & Circle Arrow (Right) */}
                    <div className="flex items-center justify-between w-full">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${themeMap.badgeBg} p-2 shadow-sm border border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0`}>
                        <img
                          src={themeMap.image}
                          alt={getModeLabel(id)}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-xs border-2 ${themeMap.arrowBorder} shadow-xs flex items-center justify-center ${themeMap.arrowColor} text-base sm:text-lg font-black group-hover:scale-110 transition-transform`}>
                        ➔
                      </div>
                    </div>

                    {/* Bottom Row: Big Bold Difficulty Title */}
                    <div className="mt-5 sm:mt-6">
                      <h3 className={`text-2xl sm:text-3xl font-black ${themeMap.titleColor} tracking-tight`}>
                        {getModeLabel(id)}
                      </h3>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              <div className="bg-white p-4 rounded-2xl border border-[#e7e5f0] shadow-xs">
                <b className="block text-2xl font-black text-[#56d8d0]">{stats.games}</b>
                <span className="text-xs font-bold text-[#77748a]">{t("gamesPlayed")}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#e7e5f0] shadow-xs">
                <b className="block text-2xl font-black text-[#7567f8]">{accuracy}%</b>
                <span className="text-xs font-bold text-[#77748a]">{t("recallAccuracy")}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#e7e5f0] shadow-xs">
                <b className="block text-2xl font-black text-[#ffd166]">{stats.best}</b>
                <span className="text-xs font-bold text-[#77748a]">{t("bestScore")}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#e7e5f0] shadow-xs">
                <b className="block text-2xl font-black text-[#ff6fae]">{stats.streak} {stats.streak === 1 ? t("daySingular") : t("dayPlural")}</b>
                <span className="text-xs font-bold text-[#77748a]">{t("playStreak")}</span>
              </div>
            </div>
          </div>
        )}

        {screen === "game" && (
          <div className="max-w-md mx-auto flex flex-col gap-3.5 sm:gap-4 animate-fadeIn">
            {/* Top Status Bar */}
            <div className="flex items-center justify-between bg-white px-4 py-3 sm:py-3.5 rounded-2xl border border-[#e7e5f0] shadow-xs">
              <button onClick={home} className="text-xs font-bold text-[#77748a] hover:text-[#171329] transition-colors cursor-pointer">
                {t("menuBack")}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white px-2.5 py-0.5 rounded-full" style={{ backgroundColor: config.color }}>
                  {getModeLabel(mode)}
                </span>
                <b className="text-xs font-black text-[#77748a]">{t("roundText")} {round} / {config.rounds}</b>
              </div>
              <div className="text-right">
                <span className="block text-[9px] font-bold text-[#77748a] uppercase">{t("scoreText")}</span>
                <b className="text-lg sm:text-xl font-black text-[#7567f8]">{score}</b>
              </div>
            </div>

            {/* Round Instructions & Timer */}
            <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-[#e7e5f0] shadow-xs flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#77748a] uppercase">
                  {revealed ? t("memorizePattern") : t("rebuildPattern")}
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-[#171329] mt-0.5">
                  {revealed ? t("lockItIn") : t("yourTurn")}
                </h2>
                <p className="text-xs font-medium text-[#77748a] mt-0.5">
                  {revealed ? t("rememberGlowing") : t("tapGlowing")}
                </p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                <div className="text-right">
                  <b className="block text-2xl sm:text-3xl font-black" style={{ color: revealed ? config.color : "#7567f8" }}>
                    {seconds}
                  </b>
                  <span className="block text-[9px] font-bold text-[#77748a] uppercase">{t("secondsText")}</span>
                </div>
              </div>
            </div>

            {/* Pattern Grid */}
            <div
              className="grid gap-2.5 p-3 sm:p-4 bg-white rounded-3xl border border-[#e7e5f0] shadow-sm transition-all duration-300"
              style={{ gridTemplateColumns: `repeat(${config.grid}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: config.grid * config.grid }, (_, idx) => {
                const isTarget = targets.includes(idx);
                const isPicked = picked.includes(idx);
                const isLit = revealed && isTarget;

                return (
                  <button
                    key={idx}
                    disabled={revealed || isPicked}
                    onClick={() => pick(idx)}
                    className={`aspect-square rounded-2xl transition-all duration-200 flex items-center justify-center text-2xl font-bold cursor-pointer ${
                      isLit
                        ? "shadow-md scale-95 border-2 border-white/50"
                        : isPicked
                        ? "bg-[#7567f8] text-white shadow-sm border-2 border-[#7567f8]"
                        : "bg-[#f2f4fa] hover:bg-[#e7eaf7] border border-[#d8dceb] active:scale-95"
                    }`}
                    style={{ backgroundColor: isLit ? config.color : undefined }}
                  >
                    {isLit && "✦"}
                    {isPicked && "✓"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {screen === "results" && result && (
          <div className="max-w-md mx-auto flex flex-col gap-5 text-center animate-fadeIn py-4">
            <div className="w-16 h-16 rounded-2xl bg-[#f0efff] text-[#7567f8] text-3xl flex items-center justify-center mx-auto shadow-xs">
              🏆
            </div>
            <div>
              <p className="text-[11px] font-black tracking-widest text-[#77748a] uppercase">{t("runComplete")}</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#171329] mt-0.5">
                {percent(result.hits, result.hits + result.misses) >= 80
                  ? t("patternLocked")
                  : percent(result.hits, result.hits + result.misses) >= 50
                  ? t("youHeldOwn")
                  : t("brainWarmingUp")}
              </h2>
            </div>

            <div className="bg-[#171329] text-white p-6 rounded-3xl shadow-md">
              <span className="text-[10px] font-black tracking-widest text-[#a8a3c7] uppercase">{t("finalScore")}</span>
              <b className="block text-5xl font-black text-[#ffd166] my-1">{result.score}</b>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-[#e7e5f0] shadow-xs">
                <b className="block text-xl font-black text-[#3bc58a]">{result.hits}</b>
                <span className="text-[10px] font-bold text-[#77748a]">{t("hitsText")}</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-[#e7e5f0] shadow-xs">
                <b className="block text-xl font-black text-[#ff6b6b]">{result.misses}</b>
                <span className="text-[10px] font-bold text-[#77748a]">{t("missesText")}</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-[#e7e5f0] shadow-xs">
                <b className="block text-xl font-black text-[#7567f8]">{percent(result.hits, result.hits + result.misses)}%</b>
                <span className="text-[10px] font-bold text-[#77748a]">{t("accuracyText")}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                onClick={() => start(mode)}
                className="flex-1 py-4 rounded-2xl bg-[#7567f8] hover:bg-[#6253e6] text-white font-black text-base tracking-wide shadow-md transition-all cursor-pointer"
              >
                {t("nextRoundBtn")}
              </button>
              <button
                onClick={home}
                className="flex-1 py-4 rounded-2xl bg-white border border-[#d8dceb] text-[#171329] font-black text-base hover:bg-[#f6f7fc] transition-all cursor-pointer"
              >
                {t("changeModeBtn")}
              </button>
            </div>
          </div>
        )}
      </div>

      <BambooStrip />
    </div>
  );
}

interface SmritiItem {
  id: string;
  symbol: string;
  name: string;
  sound: number;
}

const SMRITI_INSTRUMENTS: SmritiItem[] = [
  { id: "dhol", symbol: "🥁", name: "Dhol", sound: 220 },
  { id: "taal", symbol: "🪘", name: "Taal", sound: 330 },
  { id: "pepa", symbol: "🎺", name: "Pepa", sound: 440 },
  { id: "gogona", symbol: "🪕", name: "Gogona", sound: 550 },
  { id: "bahi", symbol: "🪈", name: "Flute", sound: 660 },
  { id: "bhortaal", symbol: "🔔", name: "Bhortaal", sound: 770 },
];

function playSmritiSound(freq: number, padIdx?: number) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = (padIdx ?? 0) % 2 === 0 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

function playSmritiChime(success: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const freqs = success ? [523.25, 659.25, 783.99] : [300, 250];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  } catch (e) {}
}

function SmritiTaalScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { lang } = useLang();
  const [screen, setScreen] = useState<"home" | "game" | "recall" | "results">("home");
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const totalRounds = 6;
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInputs, setUserInputs] = useState<number[]>([]);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [phase, setPhase] = useState<"demo" | "input" | "recall">("demo");
  const [recallOptions, setRecallOptions] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [results, setResults] = useState<{ attnOk: boolean; recOk: boolean }[]>([]);

  const getInstName = (inst: SmritiItem) => {
    const map: Record<string, Record<Lang, string>> = {
      dhol: { en: "Dhol", as: "ঢোল", mn: "ঢোল" },
      taal: { en: "Taal", as: "তাল", mn: "তাল" },
      pepa: { en: "Pepa", as: "পেঁপা", mn: "পেঁপা" },
      gogona: { en: "Gogona", as: "গগনা", mn: "গগনা" },
      bahi: { en: "Flute", as: "বাঁহী", mn: "বাঁহী" },
      bhortaal: { en: "Bhortaal", as: "ভোৰতাল", mn: "ভোৰতাল" },
      xinga: { en: "Xinga", as: "শিঙা", mn: "শিঙা" },
    };
    return map[inst.id]?.[lang] || inst.name;
  };

  const startSession = () => {
    setRound(1);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setResults([]);
    startRound(1, 0, 0, 0, []);
  };

  const startRound = (rNum: number, currStreak: number, bStreak: number, cCount: number, resList: { attnOk: boolean; recOk: boolean }[]) => {
    setRound(rNum);
    setStreak(currStreak);
    setBestStreak(bStreak);
    setCorrectCount(cCount);
    setResults(resList);
    setUserInputs([]);

    const seqLen = Math.min(2 + Math.floor(rNum / 2), 6);
    const newSeq = Array.from({ length: seqLen }, () => Math.floor(Math.random() * SMRITI_INSTRUMENTS.length));
    setSequence(newSeq);
    setScreen("game");
    setPhase("demo");

    playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    setPhase("demo");
    setActivePad(null);
    await new Promise((r) => setTimeout(r, 600));

    for (let i = 0; i < seq.length; i++) {
      const padIdx = seq[i];
      setActivePad(padIdx);
      playSmritiSound(SMRITI_INSTRUMENTS[padIdx].sound, padIdx);
      await new Promise((r) => setTimeout(r, 550));
      setActivePad(null);
      await new Promise((r) => setTimeout(r, 250));
    }

    setPhase("input");
    setUserInputs([]);
  };

  const handlePadTap = (idx: number) => {
    if (phase !== "input") return;

    setActivePad(idx);
    playSmritiSound(SMRITI_INSTRUMENTS[idx].sound, idx);
    setTimeout(() => setActivePad(null), 180);

    const nextInputs = [...userInputs, idx];
    setUserInputs(nextInputs);

    const matchIdx = nextInputs.length - 1;
    if (nextInputs[matchIdx] !== sequence[matchIdx]) {
      // Sequence failed
      playSmritiChime(false);
      const nextStreak = 0;
      const nextResults = [...results, { attnOk: false, recOk: false }];
      setTimeout(() => advanceRound(nextStreak, bestStreak, correctCount, nextResults), 800);
      return;
    }

    if (nextInputs.length === sequence.length) {
      // Sequence passed! Move to bonus recall question: "Which instrument played first?"
      playSmritiChime(true);
      const nextStreak = streak + 1;
      const newBest = Math.max(bestStreak, nextStreak);

      const firstInstrument = sequence[0];
      const otherIndices = SMRITI_INSTRUMENTS.map((_, i) => i).filter((i) => i !== firstInstrument);
      const shuffledOthers = [...otherIndices].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...shuffledOthers, firstInstrument].sort(() => Math.random() - 0.5);

      setRecallOptions(options);
      setStreak(nextStreak);
      setBestStreak(newBest);
      setPhase("recall");
      setScreen("recall");
    }
  };

  const handleRecallAnswer = (chosenIdx: number) => {
    const recOk = chosenIdx === sequence[0];
    playSmritiChime(recOk);

    const nextCorrect = correctCount + 1;
    const nextResults = [...results, { attnOk: true, recOk }];

    setTimeout(() => {
      advanceRound(streak, bestStreak, nextCorrect, nextResults);
    }, 750);
  };

  const advanceRound = (currStreak: number, bStreak: number, cCount: number, resList: { attnOk: boolean; recOk: boolean }[]) => {
    if (round >= totalRounds) {
      finishSession(cCount, bStreak, resList);
    } else {
      startRound(round + 1, currStreak, bStreak, cCount, resList);
    }
  };

  const finishSession = (cCount: number, bStreak: number, resList: { attnOk: boolean; recOk: boolean }[]) => {
    setCorrectCount(cCount);
    setBestStreak(bStreak);
    setResults(resList);
    setScreen("results");

    const acc = Math.round((cCount / totalRounds) * 100);
    const score = cCount * 150 + bStreak * 50;

    api.logActivity("game", { game: "Smriti Taal", score, accuracy: acc, level }).catch(() => {});
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FAF5EC] text-[#20302C]">
      <BambooStrip />
      <NavBar title={t("smritiNavTitle")} onBack={onBack} />

      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">
        {screen === "home" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Hero Card */}
            <div className="bg-gradient-to-br from-[#2F6B62] to-[#20514A] text-white p-6 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold tracking-widest uppercase opacity-80">{t("levelLabel")} {level}</span>
                  <h2 className="text-2xl sm:text-3xl font-black mt-0.5">{t("rhythmMemoryTitle")}</h2>
                </div>
                <span className="text-4xl">🥁</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-emerald-100 mt-2">
                {t("rhythmMemorySub")}
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-[#E7DFD0] text-center shadow-xs">
                <b className="block text-2xl font-black text-[#DB7B25]">🔥 {bestStreak}</b>
                <span className="text-[11px] font-extrabold text-[#6B7A75] uppercase">{t("bestStreakLabel")}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#E7DFD0] text-center shadow-xs">
                <b className="block text-2xl font-black text-[#2F6B62]">{t("levelLabel")} {level}</b>
                <span className="text-[11px] font-extrabold text-[#6B7A75] uppercase">{t("currentLevelLabel")}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#E7DFD0] text-center shadow-xs">
                <b className="block text-2xl font-black text-[#3B8B6B]">{totalRounds}</b>
                <span className="text-[11px] font-extrabold text-[#6B7A75] uppercase">{t("roundsSessionLabel")}</span>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startSession}
              className="w-full py-4 rounded-2xl bg-[#2F6B62] hover:bg-[#20514A] text-white font-black text-lg tracking-wide shadow-md transition-all cursor-pointer active:scale-98"
            >
              {t("startPlayingBtn")}
            </button>
          </div>
        )}

        {screen === "game" && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* Top Bar */}
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-[#E7DFD0] shadow-xs">
              <button onClick={() => setScreen("home")} className="text-xs font-bold text-[#6B7A75] hover:text-[#20302C] transition-colors cursor-pointer">
                {t("homeBack")}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#2F6B62] bg-[#E2EFEB] px-3 py-1 rounded-full">
                  {t("roundText")} {round} / {totalRounds}
                </span>
                {streak >= 2 && (
                  <span className="text-xs font-black text-[#DB7B25] bg-[#FBEBE0] px-2.5 py-1 rounded-full animate-bounce">
                    🔥 {streak}x {t("streakBadge")}
                  </span>
                )}
              </div>
            </div>

            {/* Prompt Box */}
            <div className="bg-[#E6F2ED] p-5 rounded-2xl border border-[#2F6B6230] text-center flex items-center justify-center gap-3">
              <span className="text-2xl">🔊</span>
              <p className="text-lg font-bold text-[#2F6B62]">
                {phase === "demo" ? t("listenCarefully") : t("nowRepeatSeq")}
              </p>
            </div>

            {/* Instruments Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-2">
              {SMRITI_INSTRUMENTS.map((inst, idx) => {
                const isLit = activePad === idx;
                return (
                  <button
                    key={inst.id}
                    disabled={phase !== "input"}
                    onClick={() => handlePadTap(idx)}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      isLit
                        ? "bg-[#2F6B62] text-white border-[#20514A] scale-105 shadow-lg"
                        : "bg-white border-[#E7DFD0] text-[#20302C] hover:border-[#2F6B6240] shadow-xs active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed"
                    }`}
                  >
                    <span className="text-3xl">{inst.symbol}</span>
                    <span className="text-sm font-extrabold">{getInstName(inst)}</span>
                  </button>
                );
              })}
            </div>

            {phase === "input" && (
              <button
                onClick={() => playSequence(sequence)}
                className="mx-auto text-xs font-extrabold text-[#2F6B62] bg-[#E2EFEB] px-4 py-2 rounded-xl cursor-pointer hover:bg-[#2F6B62] hover:text-white transition-all"
              >
                {t("hearAgainBtn")}
              </button>
            )}
          </div>
        )}

        {screen === "recall" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Top Bar */}
            <div className="bg-[#FBEBE0] p-5 rounded-2xl border border-[#F3D2B8] text-center">
              <span className="text-3xl">❓</span>
              <h3 className="text-xl font-black text-[#20302C] mt-2">{t("whichPlayedFirst")}</h3>
              <p className="text-xs font-semibold text-[#6B7A75] mt-1">{t("tapCorrectInst")}</p>
            </div>

            {/* Recall Options */}
            <div className="grid grid-cols-2 gap-4">
              {recallOptions.map((optIdx) => {
                const inst = SMRITI_INSTRUMENTS[optIdx];
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleRecallAnswer(optIdx)}
                    className="bg-white p-6 rounded-2xl border-2 border-[#E7DFD0] hover:border-[#2F6B62] flex flex-col items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95"
                  >
                    <span className="text-4xl">{inst.symbol}</span>
                    <span className="text-base font-black text-[#20302C]">{getInstName(inst)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {screen === "results" && (
          <div className="flex flex-col gap-6 text-center animate-fadeIn py-2 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#E2EFEB] text-[#2F6B62] text-3xl flex items-center justify-center mx-auto shadow-sm">
              {Math.round((correctCount / totalRounds) * 100) >= 80 ? "🎉" : "😊"}
            </div>

            <div>
              <p className="text-[11px] font-black tracking-widest text-[#6B7A75] uppercase">{t("sessionComplete")}</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#20302C] mt-0.5">
                {Math.round((correctCount / totalRounds) * 100) >= 80 ? t("wonderfulRhythm") : t("goodPractice")}
              </h2>
            </div>

            {/* Score Banner */}
            <div className="bg-[#2F6B62] text-white p-6 rounded-2xl shadow-lg">
              <span className="text-[10px] font-black tracking-widest text-emerald-200 uppercase">{t("totalAccuracy")}</span>
              <b className="block text-5xl font-black text-[#C99A2E] my-1">
                {Math.round((correctCount / totalRounds) * 100)}%
              </b>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-white p-4 rounded-2xl border border-[#E7DFD0] shadow-xs">
                <b className="block text-2xl font-black text-[#2F6B62]">{correctCount}/{totalRounds}</b>
                <span className="text-xs font-bold text-[#6B7A75]">{t("roundsPassed")}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#E7DFD0] shadow-xs">
                <b className="block text-2xl font-black text-[#DB7B25]">🔥 {bestStreak}</b>
                <span className="text-xs font-bold text-[#6B7A75]">{t("bestStreakLabel")}</span>
              </div>
            </div>

            {/* Timeline Dots */}
            <div className="bg-white p-4 rounded-2xl border border-[#E7DFD0]">
              <h4 className="text-xs font-black uppercase text-[#6B7A75] tracking-wider mb-2.5">{t("roundTimeline")}</h4>
              <div className="flex justify-center gap-2">
                {results.map((r, i) => (
                  <span
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white ${
                      r.attnOk && r.recOk ? "bg-[#3B8B6B]" : r.attnOk ? "bg-[#A8813C]" : "bg-[#BF5B34]"
                    }`}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={startSession}
                className="w-full py-3.5 rounded-2xl bg-[#2F6B62] hover:bg-[#20514A] text-white font-black text-sm tracking-wide shadow-md transition-all cursor-pointer active:scale-98"
              >
                {t("playAgainBtn")}
              </button>
              <button
                onClick={() => setScreen("home")}
                className="w-full py-3 rounded-2xl bg-white border border-[#E7DFD0] text-[#20302C] font-bold text-xs hover:bg-[#FAF5EC] transition-all cursor-pointer"
              >
                {t("backToMenuBtn")}
              </button>
            </div>
          </div>
        )}
      </div>

      <BambooStrip />
    </div>
  );
}

// ── Game 4: Sanga Memory & Recall Component ───────────────────────────────

interface SangaItem {
  id: string;
  emoji: string;
  en: string;
  as: string;
  hi: string;
  mn: string;
  category: string;
}

const SANGA_CATALOG: SangaItem[] = [
  // Animals
  { id: "dog", emoji: "🐕", en: "Dog", as: "কুকুৰ", hi: "कुत्ता", mn: "হুই", category: "animal" },
  { id: "cat", emoji: "🐱", en: "Cat", as: "মেকুৰী", hi: "बिल्ली", mn: "হৌদোক", category: "animal" },
  { id: "cow", emoji: "🐄", en: "Cow", as: "গৰু", hi: "गाय", mn: "শনম", category: "animal" },
  { id: "elephant", emoji: "🐘", en: "Elephant", as: "হাতী", hi: "हाथी", mn: "শামু", category: "animal" },
  { id: "monkey", emoji: "🐒", en: "Monkey", as: "বানৰ", hi: "बंदर", mn: "য়োং", category: "animal" },
  { id: "bird", emoji: "🐦", en: "Bird", as: "চৰাই", hi: "पक्षी", mn: "উচেক", category: "animal" },
  { id: "fish", emoji: "🐟", en: "Fish", as: "মাছ", hi: "मछली", mn: "ঙা", category: "animal" },
  // Fruits
  { id: "apple", emoji: "🍎", en: "Apple", as: "আপেল", hi: "सेब", mn: "सेब", category: "fruit" },
  { id: "banana", emoji: "🍌", en: "Banana", as: "কল", hi: "केला", mn: "লাফোই", category: "fruit" },
  { id: "mango", emoji: "🥭", en: "Mango", as: "আম", hi: "आम", mn: "হেইনৌ", category: "fruit" },
  { id: "orange", emoji: "🍊", en: "Orange", as: "কমলা", hi: "संतरा", mn: "কমলা", category: "fruit" },
  { id: "watermelon", emoji: "🍉", en: "Watermelon", as: "তৰমুজ", hi: "तरबूज", mn: "তৰমুজ", category: "fruit" },
  // Daily items
  { id: "cup", emoji: "☕", en: "Cup", as: "কাপ", hi: "कप", mn: "কাপ", category: "daily" },
  { id: "spoon", emoji: "🥄", en: "Spoon", as: "চামুচ", hi: "चम्मच", mn: "চামুচ", category: "daily" },
  { id: "key", emoji: "🔑", en: "Key", as: "চাবি", hi: "चाबी", mn: "চাবি", category: "daily" },
  { id: "book", emoji: "📖", en: "Book", as: "কিতাপ", hi: "किताब", mn: "লাইৰিক", category: "daily" },
  { id: "glasses", emoji: "👓", en: "Glasses", as: "চশমা", hi: "चश्मा", mn: "চশমা", category: "daily" },
  { id: "bag", emoji: "👜", en: "Bag", as: "বেগ", hi: "बैग", mn: "বেগ", category: "daily" },
  { id: "clock", emoji: "🕐", en: "Clock", as: "ঘড়ী", hi: "घड़ी", mn: "পুং", category: "daily" },
  // Household
  { id: "chair", emoji: "🪑", en: "Chair", as: "চকী", hi: "कुर्सी", mn: "চকী", category: "household" },
  { id: "bed", emoji: "🛏️", en: "Bed", as: "বিচনা", hi: "बिस्तर", mn: "বিচনা", category: "household" },
  { id: "lamp", emoji: "💡", en: "Lamp", as: "চাকি/লেম্প", hi: "लैंप", mn: "থাইবা", category: "household" },
  { id: "tv", emoji: "📺", en: "Television", as: "টিভি", hi: "टेलीविज़न", mn: "টিভি", category: "household" },
  { id: "phone", emoji: "📞", en: "Phone", as: "ফুন", hi: "फ़ोन", mn: "ফোন", category: "household" },
  // Nature
  { id: "flower", emoji: "🌸", en: "Flower", as: "ফুল", hi: "फूल", mn: "লৈরাঙ", category: "nature" },
  { id: "tree", emoji: "🌳", en: "Tree", as: "গছ", hi: "पेड़", mn: "উমং", category: "nature" },
  { id: "sun", emoji: "☀️", en: "Sun", as: "সূৰ্য", hi: "सूरज", mn: "নুমিৎ", category: "nature" },
  { id: "moon", emoji: "🌙", en: "Moon", as: "জোন", hi: "चाँद", mn: "থা", category: "nature" },
  // Culture & Regional
  { id: "bamboo", emoji: "🎍", en: "Bamboo Craft", as: "বাঁহৰ শিল্প", hi: "बांस शिल्प", mn: "ৱা", category: "culture" },
  { id: "basket", emoji: "🧺", en: "Basket", as: "পাচি/টোকাৰী", hi: "टोकरी", mn: "পাংকোক", category: "culture" },
  { id: "tealeaf", emoji: "🍃", en: "Tea Leaf", as: "চাহ পাত", hi: "चाय पत्ती", mn: "চাহ পন", category: "culture" },
  { id: "drum", emoji: "🥁", en: "Drum", as: "ঢোল", hi: "ढोल", mn: "পুং", category: "culture" },
];

const SANGA_LEVEL_NAMES = [
  { level: 1, title: { en: "Easy Recall", as: "সহজ স্মৰণ", mn: "লাইবা লৌশিং" } },
  { level: 2, title: { en: "More Objects", as: "অধিক বস্তু", mn: "য়াম্বা পোত" } },
  { level: 3, title: { en: "Category Recall", as: "শ্ৰেণী স্মৰণ", mn: "কাংলুপ লৌশিং" } },
  { level: 4, title: { en: "Timed Memory", as: "সময়বদ্ধ স্মৃতি", mn: "মতং সোংথিং" } },
  { level: 5, title: { en: "Mixed Practice", as: "মিশ্ৰিত অনুশীলন", mn: "য়াংশিনবা লৈহাউ" } },
  { level: 6, title: { en: "Advanced Recall", as: "উন্নত স্মৰণ", mn: "খ্বাইদগী নিংথৌ" } },
];

function SangaGameScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { lang } = useLang();
  const [screen, setScreen] = useState<"home" | "memorize" | "question" | "feedback" | "results">("home");
  const [level, setLevel] = useState<number>(() => {
    const saved = localStorage.getItem("sanga_level");
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 ? 1 : Math.min(parsed, 6);
  });
  const [qIndex, setQIndex] = useState(0);
  const totalQuestions = 6;
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState<number>(() => {
    const saved = localStorage.getItem("sanga_best_streak");
    const parsed = saved ? parseInt(saved, 10) : 0;
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  });
  const [countdown, setCountdown] = useState(8);
  const [qTimer, setQTimer] = useState(0);
  const [currentQ, setCurrentQ] = useState<any>(null);
  const [chosenAnswer, setChosenAnswer] = useState<any>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const timerRef = useRef<any>(null);
  const qTimerRef = useRef<any>(null);

  const handleResetLevel = () => {
    if (window.confirm(t("confirmResetLevel"))) {
      setLevel(1);
      setBestStreak(0);
      setStreak(0);
      localStorage.removeItem("sanga_level");
      localStorage.removeItem("sanga_best_streak");
    }
  };

  const getItemLabel = (item: SangaItem) => {
    return (item as any)[lang] || item.as || item.en;
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, Record<string, string>> = {
      animal: { en: "animals", as: "জীৱ-জন্তু", mn: "শা-ঙা" },
      fruit: { en: "fruits", as: "ফল-মূল", mn: "হৈ-নোই" },
      daily: { en: "daily items", as: "দৈনিক ব্যৱহৃত বস্তু", mn: "নুমিৎ চাকখৈ" },
      household: { en: "household items", as: "ঘৰুৱা সামগ্ৰী", mn: "ইমুং পোত" },
      nature: { en: "nature items", as: "প্ৰাকৃতিক বস্তু", mn: "প্রকৃতি" },
      culture: { en: "cultural items", as: "সাংস্কৃতিক বস্তু", mn: "সংস্কৃতি" },
    };
    return map[cat]?.[lang] || map[cat]?.as || map[cat]?.en || cat;
  };

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  };

  const generateQuestion = (lvl: number) => {
    const choicesCount = 4;
    const modePool = ["recognize", "count"];
    if (lvl >= 2) modePool.push("missing");
    if (lvl >= 3) modePool.push("category");
    if (lvl >= 4) modePool.push("sequence");
    if (lvl >= 5) modePool.push("position");
    if (lvl >= 6) modePool.push("oddOneOut");

    const mode = modePool[Math.floor(Math.random() * modePool.length)];
    const numObjects = Math.min(2 + Math.floor(lvl / 2), 6);
    const shuffledCatalog = [...SANGA_CATALOG].sort(() => Math.random() - 0.5);

    if (mode === "count") {
      const targetItem = shuffledCatalog[0];
      const count = Math.floor(Math.random() * 3) + 2; // 2 to 4
      const otherItems = shuffledCatalog.slice(1, numObjects);
      const displayItems: SangaItem[] = [];
      for (let i = 0; i < count; i++) displayItems.push(targetItem);
      otherItems.forEach((it) => displayItems.push(it));

      const shuffledDisplay = displayItems.sort(() => Math.random() - 0.5);
      const options = [count, count + 1, Math.max(1, count - 1), count + 2].sort(() => Math.random() - 0.5);

      const qText = lang === "as"
        ? `আপুনি কেইটা ${getItemLabel(targetItem)} দেখিছিল?`
        : lang === "mn"
        ? `নংগী কায়াম্বা ${getItemLabel(targetItem)} উবা?`
        : `How many ${getItemLabel(targetItem).toLowerCase()} did you see?`;

      return {
        mode,
        items: shuffledDisplay,
        question: qText,
        options: options.map(String),
        correctAnswer: String(count),
        viewSeconds: Math.max(5, 9 - Math.floor(lvl * 0.5)),
      };
    }

    if (mode === "recognize") {
      const shown = shuffledCatalog.slice(0, numObjects);
      const target = shown[Math.floor(Math.random() * shown.length)];
      const distractors = shuffledCatalog.filter((o) => !shown.some((s) => s.id === o.id)).slice(0, choicesCount - 1);
      const options = [...distractors, target].sort(() => Math.random() - 0.5);

      const qText = lang === "as"
        ? "আপুনি ইয়াৰ ভিতৰত কোনটো বস্তু দেখিছিল?"
        : lang === "mn"
        ? "নংগী কদোইবা পোত উবা?"
        : "Which of these objects did you see?";

      return {
        mode,
        items: shown,
        question: qText,
        options: options.map((o) => ({ id: o.id, label: getItemLabel(o), emoji: o.emoji })),
        correctAnswer: target.id,
        viewSeconds: Math.max(5, 9 - Math.floor(lvl * 0.5)),
      };
    }

    if (mode === "missing") {
      const shown = shuffledCatalog.slice(0, Math.max(4, numObjects));
      const missingObj = shown[Math.floor(Math.random() * shown.length)];
      const secondItems = shown.filter((s) => s.id !== missingObj.id);
      const distractors = shuffledCatalog.filter((o) => !shown.some((s) => s.id === o.id)).slice(0, choicesCount - 1);
      const options = [...distractors, missingObj].sort(() => Math.random() - 0.5);

      const qText = lang === "as"
        ? "কোনটো বস্তু নোহোৱা হৈছে?"
        : lang === "mn"
        ? "কদোইবা পোত মাকখিবা?"
        : "Which object is missing?";

      return {
        mode,
        items: shown,
        secondItems,
        question: qText,
        options: options.map((o) => ({ id: o.id, label: getItemLabel(o), emoji: o.emoji })),
        correctAnswer: missingObj.id,
        viewSeconds: Math.max(5, 9 - Math.floor(lvl * 0.5)),
      };
    }

    if (mode === "sequence") {
      const seq = shuffledCatalog.slice(0, Math.min(numObjects, 4));
      const askIdx = Math.floor(Math.random() * (seq.length - 1));
      const target = seq[askIdx];
      const correctNext = seq[askIdx + 1];
      const distractors = shuffledCatalog.filter((o) => !seq.some((s) => s.id === o.id)).slice(0, choicesCount - 1);
      const options = [...distractors, correctNext].sort(() => Math.random() - 0.5);

      const qText = lang === "as"
        ? `${getItemLabel(target)}ৰ পিছত কি আহিছিল?`
        : lang === "mn"
        ? `${getItemLabel(target)}গী মতুংদ কদোইবা লাকখিবা?`
        : `What came after the ${getItemLabel(target).toLowerCase()}?`;

      return {
        mode,
        items: seq,
        question: qText,
        options: options.map((o) => ({ id: o.id, label: getItemLabel(o), emoji: o.emoji })),
        correctAnswer: correctNext.id,
        viewSeconds: Math.max(5, 9 - Math.floor(lvl * 0.5)),
      };
    }

    if (mode === "position") {
      const chosen = shuffledCatalog.slice(0, Math.min(numObjects, 5));
      const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5).slice(0, chosen.length);
      const grid = new Array(9).fill(null);
      chosen.forEach((obj, i) => { grid[positions[i]] = obj; });
      const targetIdx = Math.floor(Math.random() * chosen.length);
      const target = chosen[targetIdx];
      const correctPos = positions[targetIdx];

      const qText = lang === "as"
        ? `${getItemLabel(target)} ক'ত আছিল? (১-৯ নম্বৰ স্থান)`
        : lang === "mn"
        ? `${getItemLabel(target)} কদোইদা লৈবা?`
        : `Where was the ${getItemLabel(target).toLowerCase()}?`;

      return {
        mode,
        grid,
        targetEmoji: target.emoji,
        targetLabel: getItemLabel(target),
        question: qText,
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(String),
        correctAnswer: String(correctPos),
        viewSeconds: Math.max(6, 10 - Math.floor(lvl * 0.5)),
      };
    }

    // Default recognize fallback
    const shown = shuffledCatalog.slice(0, numObjects);
    const target = shown[0];
    const distractors = shuffledCatalog.filter((o) => !shown.some((s) => s.id === o.id)).slice(0, choicesCount - 1);
    const options = [...distractors, target].sort(() => Math.random() - 0.5);

    return {
      mode: "recognize",
      items: shown,
      question: "Which object did you see?",
      options: options.map((o) => ({ id: o.id, label: getItemLabel(o), emoji: o.emoji })),
      correctAnswer: target.id,
      viewSeconds: 6,
    };
  };

  const startSession = () => {
    setQIndex(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    startQuestion(0, 0, 0, 0);
  };

  const startQuestion = (idx: number, currScore: number, currCorrect: number, currStreak: number) => {
    if (idx >= totalQuestions) {
      finishSession(currScore, currCorrect, currStreak);
      return;
    }

    setQIndex(idx);
    setScore(currScore);
    setCorrectCount(currCorrect);
    setStreak(currStreak);
    setChosenAnswer(null);
    setLastCorrect(null);

    const q = generateQuestion(level);
    setCurrentQ(q);
    setCountdown(q.viewSeconds);
    setScreen("memorize");

    if (timerRef.current) clearInterval(timerRef.current);
    if (qTimerRef.current) clearInterval(qTimerRef.current);

    let secLeft = q.viewSeconds;
    timerRef.current = setInterval(() => {
      secLeft -= 1;
      setCountdown(secLeft);
      if (secLeft <= 0) {
        clearInterval(timerRef.current);
        openQuestionPhase();
      }
    }, 1000);
  };

  const openQuestionPhase = () => {
    setScreen("question");
    setQTimer(0);

    let elapsed = 0;
    qTimerRef.current = setInterval(() => {
      elapsed += 1;
      setQTimer(elapsed);
    }, 1000);
  };

  const handleAnswerSubmit = (ansId: string) => {
    if (screen !== "question") return;
    if (qTimerRef.current) clearInterval(qTimerRef.current);

    const isCorrect = String(ansId) === String(currentQ.correctAnswer);
    setChosenAnswer(ansId);
    setLastCorrect(isCorrect);

    const nextStreak = isCorrect ? streak + 1 : 0;
    const newBest = Math.max(bestStreak, nextStreak);
    setStreak(nextStreak);
    if (newBest > bestStreak) {
      setBestStreak(newBest);
      localStorage.setItem("sanga_best_streak", String(newBest));
    }

    const bonus = nextStreak >= 3 ? 10 : 0;
    const nextScore = isCorrect ? score + 15 + bonus : score;
    const nextCorrect = isCorrect ? correctCount + 1 : correctCount;

    setScreen("feedback");

    setTimeout(() => {
      startQuestion(qIndex + 1, nextScore, nextCorrect, nextStreak);
    }, 1600);
  };

  const finishSession = (finalScore: number, finalCorrect: number, finalStreak: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (qTimerRef.current) clearInterval(qTimerRef.current);

    setScore(finalScore);
    setCorrectCount(finalCorrect);
    setScreen("results");

    const acc = Math.round((finalCorrect / totalQuestions) * 100);

    // Auto level up if accuracy >= 70%
    if (acc >= 70 && level < 6) {
      setLevel((prev) => {
        const next = Math.min(prev + 1, 6);
        localStorage.setItem("sanga_level", String(next));
        return next;
      });
    }

    api.logActivity("game", { game: "Sanga Memory", score: finalScore, accuracy: acc, level }).catch(() => {});
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (qTimerRef.current) clearInterval(qTimerRef.current);
    };
  }, []);

  const currentLevelTitle = SANGA_LEVEL_NAMES[Math.min(level - 1, 5)]?.title[lang as keyof typeof SANGA_LEVEL_NAMES[0]["title"]] || `${t("levelLabel")} ${level}`;

  return (
    <div className="flex flex-col min-h-full bg-[#F3F4EC] text-[#223326]">
      <BambooStrip />
      <NavBar title={t("sangaNavTitle")} onBack={onBack} />

      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">
        {screen === "home" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Hero Card */}
            <div className="bg-gradient-to-br from-[#2F6B4F] to-[#234F3B] text-white p-6 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold tracking-widest uppercase opacity-80">{t("levelLabel")} {level} • {currentLevelTitle}</span>
                  <h2 className="text-2xl sm:text-3xl font-black mt-0.5">{t("sangaNavTitle")}</h2>
                </div>
                <span className="text-4xl">🧠</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-emerald-100 mt-2">
                {t("sangaHeroSub")}
              </p>
            </div>

            {/* Level Info Banner (Automatic Progression) */}
            <div className="bg-white p-5 rounded-3xl border border-[#D8DECB] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EAEEE1] text-[#2F6B4F] flex items-center justify-center text-2xl font-black flex-shrink-0">
                ⭐
              </div>
              <div>
                <b className="text-base font-black text-[#234F3B]">{t("levelLabel")} {level}: {currentLevelTitle}</b>
                <p className="text-xs font-semibold text-[#4B5C4E] mt-0.5">
                  {t("difficultyAutoText")}
                </p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-[#D8DECB] text-center shadow-xs">
                <b className="block text-2xl font-black text-[#2F6B4F]">{t("levelLabel")} {level}</b>
                <span className="text-[11px] font-extrabold text-[#4B5C4E] uppercase">{t("currentLevelLabel")}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#D8DECB] text-center shadow-xs">
                <b className="block text-2xl font-black text-[#C98F2A]">🔥 {bestStreak}</b>
                <span className="text-[11px] font-extrabold text-[#4B5C4E] uppercase">{t("bestStreakLabel")}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#D8DECB] text-center shadow-xs">
                <b className="block text-2xl font-black text-[#3B8B6B]">{totalQuestions}</b>
                <span className="text-[11px] font-extrabold text-[#4B5C4E] uppercase">{t("questionsPerRound")}</span>
              </div>
            </div>

            {/* Start Button & Reset Button */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={startSession}
                className="w-full py-4 rounded-2xl bg-[#2F6B4F] hover:bg-[#234F3B] text-white font-black text-lg tracking-wide shadow-md transition-all cursor-pointer active:scale-98"
              >
                {t("startPracticeBtn")}
              </button>

              <button
                onClick={handleResetLevel}
                className="w-full py-3 rounded-2xl bg-white border border-[#D8DECB] hover:bg-[#FFF0EB] text-[#C1613D] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                {t("resetLevelBtn")}
              </button>
            </div>
          </div>
        )}

        {screen === "memorize" && currentQ && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* Top Bar with Progress Bar & Streak */}
            <div className="flex flex-col gap-2 bg-white px-4 py-3 rounded-2xl border border-[#D8DECB] shadow-xs">
              <div className="flex items-center justify-between">
                <button onClick={() => setScreen("home")} className="text-xs font-bold text-[#4B5C4E] hover:text-[#234F3B] transition-colors cursor-pointer">
                  {t("exitBtn")}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#2F6B4F] bg-[#EAEEE1] px-3 py-1 rounded-full">
                    {t("questionOf")} {qIndex + 1} {t("of")} {totalQuestions}
                  </span>
                  {streak >= 2 && (
                    <span className="text-xs font-black text-[#C1613D] bg-[#FFF0EB] px-2.5 py-1 rounded-full animate-bounce border border-[#C1613D30]">
                      🔥 {streak}x {t("streakBadge")}
                    </span>
                  )}
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-[#E5DEC9] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#2F6B4F] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(((qIndex + 1) / totalQuestions) * 100)}%` }}
                />
              </div>
            </div>

            {/* Prompt */}
            <div className="bg-[#EAEEE1] p-4 rounded-2xl text-center border border-[#2F6B4F30]">
              <p className="text-base sm:text-lg font-black text-[#234F3B]">
                {t("lookCarefully")}
              </p>
            </div>

            {/* Countdown Ring */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#C98F2A] to-[#F1DBA9] p-1.5 mx-auto shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl font-black text-[#234F3B]">
                {countdown}
              </div>
            </div>

            {/* Items Display Stage */}
            {currentQ.mode === "position" ? (
              <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-3xl border border-[#D8DECB] shadow-xs max-w-xs mx-auto w-full">
                {currentQ.grid.map((cell: any, idx: number) => (
                  <div
                    key={idx}
                    className={`h-20 rounded-2xl border-2 flex items-center justify-center text-3xl ${
                      cell ? "bg-[#EAEEE1] border-[#2F6B4F30]" : "bg-[#F3F4EC] border-dashed border-[#D8DECB]"
                    }`}
                  >
                    {cell ? cell.emoji : ""}
                  </div>
                ))}
              </div>
            ) : currentQ.mode === "sequence" ? (
              <div className="flex items-center justify-center gap-2 flex-wrap p-5 bg-white rounded-3xl border border-[#D8DECB] shadow-xs">
                {currentQ.items.map((it: SangaItem, idx: number) => (
                  <React.Fragment key={it.id}>
                    <div className="bg-[#EAEEE1] p-4 rounded-2xl border border-[#D8DECB] flex flex-col items-center gap-1">
                      <span className="text-4xl">{it.emoji}</span>
                      <span className="text-xs font-black text-[#223326]">{getItemLabel(it)}</span>
                    </div>
                    {idx < currentQ.items.length - 1 && <span className="text-xl font-black text-[#4B5C4E]">➔</span>}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 flex-wrap p-6 bg-white rounded-3xl border border-[#D8DECB] shadow-xs">
                {currentQ.items.map((it: SangaItem) => (
                  <div key={it.id} className="bg-[#EAEEE1] p-4 sm:p-5 rounded-2xl border border-[#D8DECB] flex flex-col items-center gap-1.5 shadow-xs transition-transform hover:scale-105">
                    <span className="text-4xl sm:text-5xl">{it.emoji}</span>
                    <span className="text-xs font-black text-[#223326]">{getItemLabel(it)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(screen === "question" || screen === "feedback") && currentQ && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* Top Bar with Progress & Streak */}
            <div className="flex flex-col gap-2 bg-white px-4 py-3 rounded-2xl border border-[#D8DECB] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#4B5C4E]">{t("scoreLabel")}: {score}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#2F6B4F] bg-[#EAEEE1] px-3 py-1 rounded-full">
                    {qIndex + 1} / {totalQuestions}
                  </span>
                  {streak >= 2 && (
                    <span className="text-xs font-black text-[#C1613D] bg-[#FFF0EB] px-2.5 py-1 rounded-full animate-bounce border border-[#C1613D30]">
                      🔥 {streak}x {t("streakBadge")}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-[#4B5C4E]">⏱ {qTimer}s</span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-[#E5DEC9] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#2F6B4F] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(((qIndex + 1) / totalQuestions) * 100)}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="bg-white p-5 rounded-3xl border border-[#D8DECB] text-center shadow-xs flex flex-col items-center gap-3">
              <h3 className="text-lg sm:text-xl font-black text-[#234F3B]">{currentQ.question}</h3>
              <button
                onClick={() => speakText(currentQ.question)}
                className="text-xs font-bold text-[#2F6B4F] bg-[#EAEEE1] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-[#2F6B4F] hover:text-white transition-all cursor-pointer"
              >
                {t("readAloudBtn")}
              </button>
            </div>

            {/* Options Area */}
            {currentQ.mode === "position" ? (
              <div className="bg-white p-5 rounded-3xl border border-[#D8DECB] flex flex-col items-center gap-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{currentQ.targetEmoji}</span>
                  <b className="text-base font-black text-[#234F3B]">{currentQ.targetLabel}</b>
                </div>
                <div className="grid grid-cols-3 gap-3 max-w-xs w-full">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((posIdx) => {
                    const isChosen = String(chosenAnswer) === String(posIdx);
                    const isCorrectPos = String(currentQ.correctAnswer) === String(posIdx);
                    let btnStyle = "bg-[#F3F4EC] border-[#D8DECB] text-[#234F3B] hover:border-[#2F6B4F]";
                    if (screen === "feedback") {
                      if (isCorrectPos) btnStyle = "bg-[#E4F1E6] border-[#2F6B4F] text-[#2F6B4F] font-black";
                      else if (isChosen) btnStyle = "bg-[#F7E7E1] border-[#B5573A] text-[#B5573A]";
                    }
                    return (
                      <button
                        key={posIdx}
                        disabled={screen === "feedback"}
                        onClick={() => handleAnswerSubmit(String(posIdx))}
                        className={`h-16 rounded-2xl border-2 font-black text-xl flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                      >
                        {posIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : currentQ.mode === "count" ? (
              <div className="grid grid-cols-2 gap-3.5">
                {currentQ.options.map((numOpt: string) => {
                  const isChosen = String(chosenAnswer) === String(numOpt);
                  const isCorrect = String(currentQ.correctAnswer) === String(numOpt);
                  let btnStyle = "bg-white border-[#D8DECB] text-[#223326] hover:border-[#2F6B4F]";
                  if (screen === "feedback") {
                    if (isCorrect) btnStyle = "bg-[#E4F1E6] border-[#2F6B4F] text-[#2F6B4F] font-black";
                    else if (isChosen) btnStyle = "bg-[#F7E7E1] border-[#B5573A] text-[#B5573A]";
                  }
                  return (
                    <button
                      key={numOpt}
                      disabled={screen === "feedback"}
                      onClick={() => handleAnswerSubmit(numOpt)}
                      className={`p-6 rounded-2xl border-2 text-2xl font-black flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${btnStyle}`}
                    >
                      {numOpt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {currentQ.options.map((opt: any) => {
                  const isChosen = String(chosenAnswer) === String(opt.id);
                  const isCorrect = String(currentQ.correctAnswer) === String(opt.id);
                  let btnStyle = "bg-white border-[#D8DECB] text-[#223326] hover:border-[#2F6B4F]";
                  if (screen === "feedback") {
                    if (isCorrect) btnStyle = "bg-[#E4F1E6] border-[#2F6B4F] text-[#2F6B4F] font-black";
                    else if (isChosen) btnStyle = "bg-[#F7E7E1] border-[#B5573A] text-[#B5573A]";
                  }
                  return (
                    <button
                      key={opt.id}
                      disabled={screen === "feedback"}
                      onClick={() => handleAnswerSubmit(opt.id)}
                      className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${btnStyle}`}
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <span className="text-sm font-black text-center">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Feedback Banner */}
            {screen === "feedback" && (
              <div
                className={`p-4 rounded-2xl text-center font-black text-base shadow-sm animate-fadeIn ${
                  lastCorrect ? "bg-[#E4F1E6] text-[#234F3B]" : "bg-[#F7E7E1] text-[#B5573A]"
                }`}
              >
                {lastCorrect ? t("excellentRemembered") : t("notQuiteTryNext")}
              </div>
            )}
          </div>
        )}

        {screen === "results" && (
          <div className="flex flex-col gap-6 text-center animate-fadeIn py-2 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#EAEEE1] text-[#2F6B4F] text-3xl flex items-center justify-center mx-auto shadow-sm">
              {Math.round((correctCount / totalQuestions) * 100) >= 80 ? "🎉" : "🌟"}
            </div>

            <div>
              <p className="text-[11px] font-black tracking-widest text-[#4B5C4E] uppercase">{t("practiceComplete")}</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#234F3B] mt-0.5">
                {Math.round((correctCount / totalQuestions) * 100) >= 80 ? t("greatMemoryPerf") : t("wellPracticedToday")}
              </h2>
              {Math.round((correctCount / totalQuestions) * 100) >= 70 && level > 1 && (
                <span className="inline-block mt-2 text-xs font-black text-[#2F6B4F] bg-[#EAEEE1] px-3.5 py-1 rounded-full border border-[#2F6B4F20]">
                  {t("levelUpReached")} {level}
                </span>
              )}
            </div>

            {/* Score Banner */}
            <div className="bg-[#2F6B4F] text-white p-6 rounded-2xl shadow-lg">
              <span className="text-[10px] font-black tracking-widest text-emerald-200 uppercase">{t("finalAccuracy")}</span>
              <b className="block text-5xl font-black text-[#F1DBA9] my-1">
                {Math.round((correctCount / totalQuestions) * 100)}%
              </b>
              <span className="text-xs font-bold text-emerald-100">{correctCount} {t("of")} {totalQuestions} {t("questionsCorrect")}</span>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-white p-4 rounded-2xl border border-[#D8DECB] shadow-xs">
                <b className="block text-2xl font-black text-[#2F6B4F]">{score} pts</b>
                <span className="text-xs font-bold text-[#4B5C4E]">{t("totalScore")}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#D8DECB] shadow-xs">
                <b className="block text-2xl font-black text-[#C98F2A]">🔥 {bestStreak}</b>
                <span className="text-xs font-bold text-[#4B5C4E]">{t("bestStreakLabel")}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={startSession}
                className="w-full py-3.5 rounded-2xl bg-[#2F6B4F] hover:bg-[#234F3B] text-white font-black text-sm tracking-wide shadow-md transition-all cursor-pointer active:scale-98"
              >
                {t("nextRoundBtn")}
              </button>
              <button
                onClick={() => setScreen("home")}
                className="w-full py-3 rounded-2xl bg-white border border-[#D8DECB] text-[#234F3B] font-bold text-xs hover:bg-[#F3F4EC] transition-all cursor-pointer"
              >
                {t("backToMenuBtn")}
              </button>
              <button
                onClick={handleResetLevel}
                className="w-full py-2.5 rounded-2xl bg-[#C1613D10] text-[#C1613D] font-bold text-xs hover:bg-[#FFF0EB] transition-all cursor-pointer"
              >
                {t("resetLevelBtn")}
              </button>
            </div>
          </div>
        )}
      </div>

      <BambooStrip />
    </div>
  );
}


function ReminderFrequencyTag({ frequency, days }: { frequency?: string; days?: string[] }) {
  if (frequency === "today") {
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FFF0EB] text-[#C1613D] border border-[#C1613D30]">Today Only</span>;
  }
  if (frequency === "specific_days" && days && days.length > 0) {
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FDF3E0] text-[#D9A441] border border-[#D9A44130]">{days.join(", ")}</span>;
  }
  return <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#EEF4EE] text-[#7A9B76] border border-[#7A9B7630]">Daily</span>;
}

function AddReminderModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (reminder: api.CreateReminderPayload) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("9:00 AM");
  const [category, setCategory] = useState("medicine");
  const [frequency, setFrequency] = useState<"today" | "daily" | "specific_days">("daily");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Wed", "Fri"]);
  const [error, setError] = useState("");

  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", fontSize: "16px",
    borderRadius: "14px", border: "2px solid #D6C9B4",
    backgroundColor: "#FFFFFF", color: "#2B2B2B", outline: "none",
  };

  function toggleDay(d: string) {
    if (selectedDays.includes(d)) {
      if (selectedDays.length === 1) return;
      setSelectedDays(selectedDays.filter((item) => item !== d));
    } else {
      setSelectedDays([...selectedDays, d]);
    }
  }

  function handleSubmit() {
    if (!title.trim()) { setError("Please enter a title."); return; }
    if (frequency === "specific_days" && selectedDays.length === 0) {
      setError("Please select at least one day."); return;
    }
    onAdd({
      title: title.trim(),
      time,
      category,
      frequency,
      days: frequency === "specific_days" ? selectedDays : [],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#FAF6EF] rounded-3xl p-6 flex flex-col gap-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[22px] font-black text-[#2B2B2B]">Set New Reminder</h3>
        
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Reminder Title</label>
            <input
              style={inputStyle}
              placeholder="e.g. Morning Blood Pressure Medication"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
            />
          </div>

          <div>
            <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Time</label>
            <input
              style={inputStyle}
              placeholder="e.g. 10:30 AM"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Category</label>
            <select
              style={inputStyle}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="medicine">Medicine 💊</option>
              <option value="water">Water 💧</option>
              <option value="meal">Meal 🍲</option>
              <option value="appointment">Doctor Appointment 🩺</option>
              <option value="activity">Activity 🌿</option>
              <option value="other">Other 📌</option>
            </select>
          </div>

          <div>
            <label className="text-[13px] font-bold text-[#7A7060] block mb-1.5">Recurrence</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "today", label: "Today" },
                { key: "daily", label: "Daily" },
                { key: "specific_days", label: "Days" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFrequency(opt.key as any)}
                  className="py-2.5 px-1 rounded-xl text-[13px] font-bold border transition-all text-center"
                  style={{
                    backgroundColor: frequency === opt.key ? "#2E6F6E" : "#FFFFFF",
                    color: frequency === opt.key ? "#FFFFFF" : "#2B2B2B",
                    borderColor: frequency === opt.key ? "#2E6F6E" : "#D6C9B4",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {frequency === "specific_days" && (
            <div>
              <label className="text-[12px] font-bold text-[#7A7060] block mb-1.5">Select Days of Week</label>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className="w-10 h-10 rounded-xl text-[13px] font-black transition-all"
                    style={{
                      backgroundColor: selectedDays.includes(d) ? "#D9A441" : "#FFFFFF",
                      color: selectedDays.includes(d) ? "#FFFFFF" : "#7A7060",
                      border: `1.5px solid ${selectedDays.includes(d) ? "#D9A441" : "#D6C9B4"}`,
                    }}
                  >
                    {d[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-[14px] font-semibold text-[#C1613D]">{error}</p>}
        </div>

        <div className="flex gap-3 mt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-[#D6C9B4] text-[#7A7060] font-bold">
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 py-3 rounded-2xl bg-[#2E6F6E] text-white font-bold shadow-md">
            Save Reminder
          </button>
        </div>
      </div>
    </div>
  );
}

function RemindersScreen({ onBack }: { onBack: () => void }) {
  const [reminders, setReminders] = useState<api.ApiReminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useT();

  const loadReminders = () => {
    setLoading(true);
    api.fetchMyReminders()
      .then(setReminders)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReminders();
    const unsubscribe = subscribeSync((payload) => {
      if (payload.entity === "reminder") {
        if (payload.action === "created") {
          setReminders((prev) => [payload.data, ...prev.filter((r) => r.id !== payload.data.id)]);
        } else if (payload.action === "updated") {
          setReminders((prev) => prev.map((r) => (r.id === payload.data.id ? { ...r, ...payload.data } : r)));
        } else if (payload.action === "deleted") {
          setReminders((prev) => prev.filter((r) => r.id !== payload.data.id));
        }
      }
    });
    return unsubscribe;
  }, []);

  function toggle(id: number, currentlyDone: boolean) {
    api.completeReminder(id, !currentlyDone)
      .then((updated) => {
        setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
        if (!currentlyDone) {
          api.logActivity("reminder", { title: updated.title, category: updated.category }).catch(() => {});
        }
      })
      .catch(() => {});
  }

  function handleAddReminder(data: api.CreateReminderPayload) {
    api.createReminder(data)
      .then((created) => {
        setReminders((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
        setShowAdd(false);
      })
      .catch((err) => alert(err.message));
  }

  function handleDelete(id: number) {
    api.deleteReminder(id)
      .then(() => {
        setReminders((prev) => prev.filter((r) => r.id !== id));
        setDeletingId(null);
      })
      .catch((err) => alert(err.message));
  }

  const doneCount = reminders.filter((r) => r.isCompleted).length;

  return (
    <div className="flex flex-col min-h-full bg-[#FAF6EF]">
      <BambooStrip />
      <NavBar title={t("myReminders")} onBack={onBack} />
      {showAdd && <AddReminderModal onClose={() => setShowAdd(false)} onAdd={handleAddReminder} />}
      {deletingId !== null && (
        <ConfirmDeleteModal
          title="Delete Reminder?"
          message="Are you sure you want to delete this reminder?"
          onClose={() => setDeletingId(null)}
          onConfirm={() => handleDelete(deletingId)}
        />
      )}

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-6 gap-4">
        {/* Header & Add Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#EEF4EE] border border-[#7A9B7640]">
            <IconCheck size={22} color="#7A9B76" />
            <span className="text-[17px] font-bold text-[#2B2B2B]">
              {doneCount} of {reminders.length} completed
            </span>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#2E6F6E] text-white font-bold shadow-md"
          >
            <span>+ Add</span>
          </button>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="text-center py-10 text-[#7A7060] font-semibold">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#D6C9B4] text-[#7A7060]">
            <p className="text-[20px] font-bold">No reminders set yet</p>
            <p className="text-[14px] mt-1">Click "+ Add" to create your first reminder.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 relative">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300"
                style={{
                  backgroundColor: r.isCompleted ? "#F4F1EC" : "#FFFFFF",
                  border: `2px solid ${r.isCompleted ? "#D6C9B4" : "#2E6F6E"}40`,
                  opacity: r.isCompleted ? 0.7 : 1,
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#EBF4F4" }}
                >
                  <ReminderIcon type={r.category} size={22} color="#2E6F6E" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-bold text-[#2E6F6E]">{r.time}</p>
                    <ReminderFrequencyTag frequency={r.frequency} days={r.days} />
                  </div>
                  <p
                    className="text-[19px] font-black leading-tight text-[#2B2B2B]"
                    style={{ textDecoration: r.isCompleted ? "line-through" : "none" }}
                  >
                    {r.title}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setDeletingId(r.id)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all text-[#C1613D] hover:bg-[#FFF0EB] border border-[#C1613D30]"
                    title="Delete Reminder"
                  >
                    <IconTrash size={18} color="#C1613D" />
                  </button>

                  <button
                    onClick={() => toggle(r.id, r.isCompleted)}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
                    style={{
                      backgroundColor: r.isCompleted ? "#7A9B76" : "#FFFFFF",
                      border: `2.5px solid ${r.isCompleted ? "#7A9B76" : "#D6C9B4"}`,
                    }}
                  >
                    <IconCheck size={22} color={r.isCompleted ? "#FFFFFF" : "#D6C9B4"} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BambooStrip />
    </div>
  );
}

// ── Screen 6: Smriti AI Assistant ──────────────────────────────────────────

function SmritiScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const [listening, setListening] = useState(false);
  const [mood, setMood] = useState<string | null>(null);

  function handleMood(selectedMood: string) {
    setMood(selectedMood);
    api.logActivity("mood_checkin", { mood: selectedMood }).catch(() => {});
  }

  return (
    <div className="flex flex-col min-h-full bg-[#FAF6EF]">
      <BambooStrip />
      <NavBar title={t("talkSmriti")} onBack={onBack} />

      <div className="flex-1 px-6 py-8 flex flex-col items-center justify-between max-w-md mx-auto w-full gap-6">
        {/* Assistant Avatar */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-32 h-32 rounded-full flex items-center justify-center bg-[#7A9B76] text-white shadow-xl">
            <IconMic size={56} color="white" />
          </div>
          <div>
            <h3 className="text-[26px] font-black text-[#2B2B2B]">Smriti AI</h3>
            <p className="text-[16px] font-medium text-[#7A7060]">Your gentle voice companion</p>
          </div>
        </div>

        {/* Mic Tap Button */}
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={() => setListening(!listening)}
            className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg active:scale-95"
            style={{ backgroundColor: listening ? "#C1613D" : "#2E6F6E" }}
          >
            <IconMic size={40} color="white" />
          </button>
          <p className="text-[18px] font-bold text-[#2B2B2B]">
            {listening ? t("listening") : t("tapSpeak")}
          </p>
        </div>

        {/* How are you feeling today check-in */}
        <div className="w-full bg-white p-5 rounded-3xl border border-[#D6C9B4] flex flex-col gap-3 text-center">
          <p className="text-[17px] font-bold text-[#2B2B2B]">{t("howFeeling")}</p>
          <div className="flex gap-2">
            {[
              { label: t("happy"), value: "Happy" },
              { label: t("tired"), value: "Tired" },
              { label: t("needHelp"), value: "Need help" },
            ].map((m) => (
              <button
                key={m.value}
                onClick={() => handleMood(m.value)}
                className="flex-1 py-3 px-2 rounded-2xl border text-[14px] font-bold transition-all"
                style={{
                  backgroundColor: mood === m.value ? "#EEF4EE" : "#FAF6EF",
                  borderColor: mood === m.value ? "#7A9B76" : "#D6C9B4",
                  color: mood === m.value ? "#7A9B76" : "#2B2B2B",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BambooStrip />
    </div>
  );
}

// ── Screen 7: Chit Chat ───────────────────────────────────────────────────

function ChitChatScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const { lang } = useLang();

  // Audio file imports map — built from the question bank
  const AUDIO_BASE_PATH: Record<string, string> = {
    en: "/src/Questions in all three language/english/",
    as: "/src/Questions in all three language/assamese/",
    mn: "/src/Questions in all three language/manipuri/",
  };

  type QuizState = "loading" | "playing" | "waiting_record" | "recording" | "recorded" | "completed" | "processing" | "error";

  const [quizState, setQuizState] = useState<QuizState>("loading");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<api.ChitChatQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Audio refs
  const questionAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Start session on mount
  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const data = await api.startChitChatSession(lang);
        if (cancelled) return;
        setSessionId(data.session.id);
        setQuestions(data.questions);
        setQuizState("playing");
      } catch (err: any) {
        if (cancelled) return;
        setErrorMsg(err.message || "Failed to start session");
        setQuizState("error");
      }
    }
    start();
    return () => { cancelled = true; };
  }, []);

  // Play question audio when advancing to a new question
  useEffect(() => {
    if (quizState !== "playing" || questions.length === 0) return;
    const q = questions[currentIdx];
    if (!q) return;

    const audioPath = AUDIO_BASE_PATH[lang] + encodeURIComponent(q.audioFile);
    const audio = new Audio(audioPath);
    questionAudioRef.current = audio;
    setAudioPlaying(true);

    audio.onended = () => {
      setAudioPlaying(false);
      setQuizState("waiting_record");
    };
    audio.onerror = () => {
      setAudioPlaying(false);
      setQuizState("waiting_record");
    };

    audio.play().catch(() => {
      setAudioPlaying(false);
      setQuizState("waiting_record");
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [quizState, currentIdx, questions.length]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setQuizState("recorded");
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      recorder.start();
      setQuizState("recording");
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      setErrorMsg("Microphone access denied. Please allow microphone access.");
      setQuizState("error");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function handleNext() {
    if (!sessionId || !recordedBlob) return;

    const q = questions[currentIdx];
    if (!q) return;

    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1] || "";
      try {
        await api.submitChitChatResponse(sessionId, q.id, base64);
      } catch {
        // Continue even if upload fails
      }

      setRecordedBlob(null);
      setRecordingTime(0);

      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(currentIdx + 1);
        setQuizState("playing");
      } else {
        setQuizState("processing");
        try {
          await api.completeChitChatSession(sessionId);
        } catch {
          // Continue to completion screen even if analysis fails
        }
        setQuizState("completed");
      }
    };
    reader.readAsDataURL(recordedBlob);
  }

  async function handleQuit() {
    if (sessionId && recordedBlob) {
      // Save the current response before quitting
      const q = questions[currentIdx];
      if (q) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1] || "";
          try {
            await api.submitChitChatResponse(sessionId, q.id, base64);
            await api.completeChitChatSession(sessionId);
          } catch { /* ignore */ }
          onBack();
        };
        reader.readAsDataURL(recordedBlob);
        return;
      }
    }

    if (sessionId) {
      try {
        await api.completeChitChatSession(sessionId);
      } catch { /* ignore */ }
    }
    onBack();
  }

  const currentQ = questions[currentIdx];
  const progressPercent = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;

  return (
    <div className="flex flex-col min-h-full bg-[#FAF6EF]">
      <BambooStrip />
      <NavBar title={t("chitChatTitle")} onBack={onBack} />

      <div className="flex-1 px-5 py-6 flex flex-col items-center max-w-md mx-auto w-full gap-5">

        {/* Progress bar */}
        {quizState !== "loading" && quizState !== "error" && quizState !== "completed" && quizState !== "processing" && (
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#8B5CA8] uppercase tracking-wider">
                {t("questionOf")} {currentIdx + 1} {t("of")} {questions.length}
              </span>
              <span className="text-[13px] font-bold text-[#7A7060]">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#F3EDF8] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8B5CA8] to-[#B07CC8] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Loading */}
        {quizState === "loading" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-[#8B5CA830] border-t-[#8B5CA8] animate-spin" />
            <p className="text-[18px] font-bold text-[#7A7060]">{t("processing")}</p>
          </div>
        )}

        {/* Error */}
        {quizState === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <span className="text-[48px]">😔</span>
            <p className="text-[18px] font-bold text-[#C1613D]">{errorMsg}</p>
            <button onClick={onBack} className="px-6 py-3 rounded-2xl bg-[#2E6F6E] text-white text-[16px] font-bold">
              {t("backToHome")}
            </button>
          </div>
        )}

        {/* Question Card */}
        {currentQ && ["playing", "waiting_record", "recording", "recorded"].includes(quizState) && (
          <>
            <div className="w-full bg-[#F3EDF8] p-6 rounded-3xl border-2 border-[#8B5CA830] flex flex-col gap-4 text-center shadow-sm">
              {/* Audio playing indicator */}
              {audioPlaying && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-[#8B5CA8] rounded-full"
                        style={{
                          height: `${12 + Math.random() * 16}px`,
                          animation: `mic-pulse 0.6s ease-in-out ${i * 0.1}s infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[14px] font-bold text-[#8B5CA8] ml-2">{t("listenQuestion")}</span>
                </div>
              )}

              <p className="text-[24px] font-black text-[#2B2B2B] leading-snug">
                {currentQ.text}
              </p>
            </div>

            {/* Waiting to Record */}
            {quizState === "waiting_record" && (
              <button
                onClick={startRecording}
                className="w-full py-5 rounded-2xl bg-[#8B5CA8] text-white text-[18px] font-black shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
                style={{ minHeight: "72px" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                {t("tapRecord")}
              </button>
            )}

            {/* Recording in progress */}
            {quizState === "recording" && (
              <button
                onClick={stopRecording}
                className="w-full py-5 rounded-2xl bg-[#C1613D] text-white text-[18px] font-black shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
                style={{ minHeight: "72px", animation: "mic-pulse 1.5s ease-in-out infinite" }}
              >
                <div className="w-6 h-6 rounded-sm bg-white" />
                <span>{t("stopRec")} ({recordingTime}s)</span>
              </button>
            )}

            {/* Recording done — Quit / Next */}
            {quizState === "recorded" && (
              <div className="w-full flex gap-3">
                <button
                  onClick={handleQuit}
                  className="flex-1 py-4 rounded-2xl border-2 border-[#D6C9B4] text-[#7A7060] text-[16px] font-bold"
                  style={{ minHeight: "64px" }}
                >
                  {t("quit")}
                </button>
                <button
                  onClick={handleNext}
                  className="flex-[2] py-4 rounded-2xl bg-[#8B5CA8] text-white text-[18px] font-black shadow-lg active:scale-95 transition-transform"
                  style={{ minHeight: "64px" }}
                >
                  {currentIdx + 1 < questions.length ? t("nextQuestion") : t("wellDone")}
                </button>
              </div>
            )}
          </>
        )}

        {/* Processing */}
        {quizState === "processing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-[#F3EDF8] flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-[#8B5CA830] border-t-[#8B5CA8] animate-spin" />
            </div>
            <p className="text-[20px] font-black text-[#8B5CA8]">{t("processing")}</p>
          </div>
        )}

        {/* Completed! */}
        {quizState === "completed" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="w-full bg-[#EEF4EE] p-8 rounded-3xl border-2 border-[#7A9B76] flex flex-col items-center gap-4 text-center shadow-md">
              <span className="text-[64px]">🌿</span>
              <p className="text-[28px] font-black text-[#7A9B76]">{t("wellDone")}</p>
              <p className="text-[16px] font-bold text-[#2B2B2B]">{t("allDone")}</p>
            </div>
            <button
              onClick={onBack}
              className="w-full py-5 rounded-2xl bg-[#2E6F6E] text-white text-[20px] font-black shadow-lg"
              style={{ minHeight: "72px" }}
            >
              {t("backToHome")}
            </button>
          </div>
        )}
      </div>

      <BambooStrip />
    </div>
  );
}

// ── Screen 8: Patient Profile ─────────────────────────────────────────────

function EditPatientProfileModal({
  user,
  onClose,
  onSave,
}: {
  user: UserProfile;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
}) {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");
  const [age, setAge] = useState(user.age || "");
  const [language, setLanguage] = useState(user.language || "en");
  const [emergencyContact, setEmergencyContact] = useState(user.emergencyContact || "");
  const [avatar, setAvatar] = useState(user.avatar || "avatar-1");
  const [customUrl, setCustomUrl] = useState("");
  const [useCustom, setUseCustom] = useState(avatar.startsWith("http") || avatar.startsWith("data:image"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", fontSize: "16px",
    borderRadius: "14px", border: "2px solid #D6C9B4",
    backgroundColor: "#FFFFFF", color: "#2B2B2B", outline: "none",
  };

  async function handleSubmit() {
    if (!name.trim()) { setError("Name cannot be empty"); return; }
    setSaving(true);
    setError("");

    const selectedAvatar = useCustom && customUrl.trim() ? customUrl.trim() : avatar;

    try {
      const updated = await api.updatePatientProfile({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim(),
        age: parseInt(age) || 70,
        language,
        emergencyContact: emergencyContact.trim() || null,
        avatar: selectedAvatar,
      });

      onSave({
        ...user,
        name: updated.name,
        email: updated.email || "",
        phone: updated.phone,
        age: String(updated.age || ""),
        language: updated.language,
        careCode: updated.careCode,
        emergencyContact: updated.emergencyContact || "",
        avatar: updated.avatar || "avatar-1",
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#FAF6EF] rounded-3xl p-6 flex flex-col gap-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#D6C9B4] pb-3">
          <h3 className="text-[22px] font-black text-[#2B2B2B]">Edit Personal Profile</h3>
          <button onClick={onClose} className="text-[20px] font-bold text-[#7A7060] hover:text-[#2B2B2B]">✕</button>
        </div>

        {/* Avatar Selector */}
        <div className="flex flex-col items-center gap-3 py-2 bg-white rounded-2xl p-4 border border-[#D6C9B4]">
          <label className="text-[13px] font-bold text-[#7A7060] uppercase tracking-wider">Choose Profile Picture / Avatar</label>
          
          <UserAvatar avatar={useCustom && customUrl ? customUrl : avatar} name={name} size={72} />

          <div className="grid grid-cols-6 gap-2 mt-1">
            {Object.entries(PRESET_AVATARS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setAvatar(key); setUseCustom(false); }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${
                  !useCustom && avatar === key ? "border-[#2E6F6E] scale-110 shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: item.bg }}
              >
                {item.emoji}
              </button>
            ))}
          </div>

          <div className="w-full mt-2 text-center">
            <button
              type="button"
              onClick={() => setUseCustom(!useCustom)}
              className="text-[13px] font-bold text-[#2E6F6E] underline mb-1"
            >
              {useCustom ? "Use preset avatar" : "Or use custom image URL"}
            </button>
            {useCustom && (
              <input
                style={inputStyle}
                placeholder="https://example.com/photo.jpg"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Full Name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Phone Number</label>
              <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Age</label>
              <input style={inputStyle} type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Email Address</label>
            <input style={inputStyle} type="email" placeholder="patient@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Preferred Language</label>
            <select style={inputStyle} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="as">Assamese (অসমীয়া)</option>
              <option value="mn">Manipuri (মৈতৈলোন্)</option>
            </select>
          </div>

          <div>
            <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Emergency Contact (Name & Phone)</label>
            <input style={inputStyle} placeholder="e.g. Son Ananya (+91 9876543210)" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
          </div>

          {error && <p className="text-[14px] font-semibold text-[#C1613D]">{error}</p>}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-[#D6C9B4] text-[#7A7060] font-bold">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3.5 rounded-2xl bg-[#2E6F6E] text-white font-bold shadow-md">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Patient Progress Report Modal ──────────────────────────────────────────

function PatientProgressReportModal({ onClose }: { onClose: () => void }) {
  const [activities, setActivities] = useState<api.ActivityLog[]>([]);

  useEffect(() => {
    api.fetchMyActivities()
      .then((data: api.ActivityLog[]) => {
        setActivities(data);
      })
      .catch(() => {});
  }, []);

  const gameActivities = activities.filter((a) => a.type === "game");
  const mindsnapLogs = gameActivities.filter((a) => ((a.payload as any)?.game || "").toLowerCase().includes("mindsnap"));
  const smritiTaalLogs = gameActivities.filter((a) => ((a.payload as any)?.game || "").toLowerCase().includes("smriti"));
  const sangaLogs = gameActivities.filter((a) => ((a.payload as any)?.game || "").toLowerCase().includes("sanga"));
  const matchPairsLogs = gameActivities.filter((a) => !((a.payload as any)?.game || "").toLowerCase().includes("mindsnap") && !((a.payload as any)?.game || "").toLowerCase().includes("smriti") && !((a.payload as any)?.game || "").toLowerCase().includes("sanga"));

  const allAccuracies = gameActivities
    .map((a) => Number((a.payload as any)?.accuracy))
    .filter((acc) => !isNaN(acc) && acc > 0);
  const overallAcc = allAccuracies.length > 0
    ? Math.round(allAccuracies.reduce((a, b) => a + b, 0) / allAccuracies.length)
    : 85;

  const totalGames = gameActivities.length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-[#FAF6EF] w-full max-w-lg rounded-3xl border-2 border-[#D6C9B4] shadow-2xl p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D6C9B430] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF4F4] text-[#2E6F6E] text-2xl flex items-center justify-center font-black">
              📊
            </div>
            <div>
              <h3 className="text-xl font-black text-[#2B2B2B]">Patient Progress Report</h3>
              <p className="text-xs font-semibold text-[#7A7060]">All-time cognitive & game performance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAF6EF] hover:bg-[#EBF4F4] text-[#7A7060] font-black text-lg flex items-center justify-center transition-all cursor-pointer border border-[#D6C9B4]"
          >
            ✕
          </button>
        </div>

        {/* Overall Accuracy Ring & Stats */}
        <div className="bg-white p-6 rounded-3xl border border-[#D6C9B4] text-center shadow-xs flex flex-col items-center gap-3">
          <span className="text-[11px] font-black uppercase text-[#7A7060] tracking-widest">OVERALL ACCURACY</span>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="#EBF4F4" strokeWidth="10" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#2E6F6E"
                strokeWidth="10"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * overallAcc) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-[#2E6F6E]">{overallAcc}%</span>
              <span className="text-[10px] font-bold text-[#7A7060]">Accuracy</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full mt-2">
            <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E5DEC9] text-center">
              <b className="block text-xl font-black text-[#2E6F6E]">{totalGames}</b>
              <span className="text-[11px] font-bold text-[#7A7060]">Games Played</span>
            </div>
            <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E5DEC9] text-center">
              <b className="block text-xl font-black text-[#7567f8]">4 Games</b>
              <span className="text-[11px] font-bold text-[#7A7060]">Active Arcades</span>
            </div>
          </div>
        </div>

        {/* Breakdown Per Game */}
        <div className="flex flex-col gap-3">
          <h4 className="text-[12px] font-black uppercase tracking-wider text-[#7A7060]">Game Wise Performance</h4>

          {/* Game 1: Mindsnap Arcade */}
          <div className="bg-white p-4 rounded-2xl border border-[#D6C9B4] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <b className="text-sm font-black text-[#2B2B2B]">Mindsnap Memory Arcade</b>
                <p className="text-[11px] font-bold text-[#7A7060]">{mindsnapLogs.length} Sessions</p>
              </div>
            </div>
            <span className="text-xs font-black text-[#7567f8] bg-[#F3E8FF] px-3 py-1 rounded-full border border-[#7567f820]">
              Visual Memory
            </span>
          </div>

          {/* Game 2: Match the Pairs */}
          <div className="bg-white p-4 rounded-2xl border border-[#D6C9B4] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧩</span>
              <div>
                <b className="text-sm font-black text-[#2B2B2B]">Match the Pairs</b>
                <p className="text-[11px] font-bold text-[#7A7060]">{matchPairsLogs.length} Sessions</p>
              </div>
            </div>
            <span className="text-xs font-black text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-full border border-[#05966920]">
              Card Pairing
            </span>
          </div>

          {/* Game 3: Smriti Taal */}
          <div className="bg-white p-4 rounded-2xl border border-[#D6C9B4] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥁</span>
              <div>
                <b className="text-sm font-black text-[#2B2B2B]">Smriti Taal — Rhythm</b>
                <p className="text-[11px] font-bold text-[#7A7060]">{smritiTaalLogs.length} Sessions</p>
              </div>
            </div>
            <span className="text-xs font-black text-[#2F6B62] bg-[#E2EFEB] px-3 py-1 rounded-full border border-[#2F6B6220]">
              Audio Sequence
            </span>
          </div>

          {/* Game 4: Sanga Memory */}
          <div className="bg-white p-4 rounded-2xl border border-[#D6C9B4] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧠</span>
              <div>
                <b className="text-sm font-black text-[#2B2B2B]">Sanga Memory & Recall</b>
                <p className="text-[11px] font-bold text-[#7A7060]">{sangaLogs.length} Sessions</p>
              </div>
            </div>
            <span className="text-xs font-black text-[#2F6B4F] bg-[#EAEEE1] px-3 py-1 rounded-full border border-[#2F6B4F20]">
              Cognitive Practice
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-[#2E6F6E] text-white font-black text-sm tracking-wide shadow-md transition-all cursor-pointer active:scale-98 mt-2"
        >
          Close Report
        </button>
      </div>
    </div>
  );
}

function ProfileScreen({ onBack, onLogout }: { onBack: () => void; onLogout: () => void }) {
  const { user, setUser } = useUser();
  const [careCode, setCareCode] = useState<string>(user.careCode || "");
  const [qrCode, setQrCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  useEffect(() => {
    api.fetchCareCode()
      .then((data) => {
        setCareCode(data.careCode);
        setQrCode(data.qr);
      })
      .catch(() => {});

    api.fetchPatientProfile()
      .then((p) => {
        setUser((prev) => ({
          ...prev,
          id: p.id,
          name: p.name,
          email: p.email || "",
          phone: p.phone,
          age: String(p.age || ""),
          language: p.language,
          careCode: p.careCode,
          emergencyContact: p.emergencyContact || "",
          avatar: p.avatar || "avatar-1",
        }));
      })
      .catch(() => {});
  }, []);

  function handleCopy() {
    if (!careCode) return;
    navigator.clipboard.writeText(careCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const langNames: Record<string, string> = {
    en: "English",
    as: "Assamese (অসমীয়া)",
    mn: "Manipuri (মৈতৈলোন্)",
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FAF6EF]">
      <BambooStrip />
      <NavBar title="My Profile" onBack={onBack} />
      {showEdit && (
        <EditPatientProfileModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => setUser(updated)}
        />
      )}
      {showProgressModal && (
        <PatientProgressReportModal onClose={() => setShowProgressModal(false)} />
      )}

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* Progress Report Button */}
        <button
          onClick={() => setShowProgressModal(true)}
          className="w-full py-4 rounded-3xl bg-gradient-to-r from-[#2E6F6E] to-[#20514A] text-white font-black text-[16px] shadow-md transition-all active:scale-98 flex items-center justify-center gap-3"
        >
          <span>📊 View All-Time Progress Report</span>
        </button>

        {/* Header Card with Avatar & Primary Info */}
        <div className="bg-white rounded-3xl p-6 border border-[#D6C9B4] shadow-sm flex flex-col items-center gap-4 text-center relative">
          <div className="relative">
            <UserAvatar avatar={user.avatar} name={user.name} size={96} />
            <button
              onClick={() => setShowEdit(true)}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#2E6F6E] text-white flex items-center justify-center shadow-md text-sm border-2 border-white hover:scale-105"
              title="Change Photo"
            >
              ✏️
            </button>
          </div>

          <div>
            <h3 className="text-[26px] font-black text-[#2B2B2B]">{user.name || "Patient Account"}</h3>
            <p className="text-[15px] font-bold text-[#7A7060] mt-0.5">
              {user.phone ? `📱 ${user.phone}` : "No phone number"} {user.age ? `• ${user.age} yrs` : ""}
            </p>
          </div>

          <button
            onClick={() => setShowEdit(true)}
            className="w-full py-3 rounded-2xl bg-[#EBF4F4] border border-[#2E6F6E30] text-[#2E6F6E] font-black text-[16px] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>✏️ Edit Profile Details</span>
          </button>
        </div>

        {/* Personal Details Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-[#D6C9B4] shadow-sm flex flex-col gap-4">
          <h4 className="text-[14px] font-black uppercase tracking-wider text-[#2E6F6E] border-b border-[#F0E8DC] pb-2">
            Personal Details
          </h4>

          <div className="grid grid-cols-1 gap-3 text-left">
            <div className="flex items-center justify-between py-1">
              <span className="text-[14px] font-bold text-[#7A7060]">Full Name</span>
              <span className="text-[16px] font-extrabold text-[#2B2B2B]">{user.name || "Not set"}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-[#FAF6EF]">
              <span className="text-[14px] font-bold text-[#7A7060]">Phone Number</span>
              <span className="text-[16px] font-extrabold text-[#2B2B2B]">{user.phone || "Not set"}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-[#FAF6EF]">
              <span className="text-[14px] font-bold text-[#7A7060]">Email Address</span>
              <span className="text-[16px] font-extrabold text-[#2B2B2B]">{user.email || "Not set"}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-[#FAF6EF]">
              <span className="text-[14px] font-bold text-[#7A7060]">Age</span>
              <span className="text-[16px] font-extrabold text-[#2B2B2B]">{user.age ? `${user.age} years old` : "Not set"}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-[#FAF6EF]">
              <span className="text-[14px] font-bold text-[#7A7060]">Language</span>
              <span className="text-[16px] font-extrabold text-[#2B2B2B]">{langNames[user.language || "en"] || "English"}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-[#FAF6EF]">
              <span className="text-[14px] font-bold text-[#7A7060]">Emergency Contact</span>
              <span className="text-[16px] font-extrabold text-[#C1613D]">{user.emergencyContact || "Not set"}</span>
            </div>
          </div>
        </div>

        {/* Care Code Card */}
        <div className="bg-white p-6 rounded-3xl border-2 border-[#2E6F6E40] shadow-sm flex flex-col items-center gap-4 text-center">
          <p className="text-[13px] font-black uppercase tracking-widest text-[#2E6F6E]">Your Unique Care Code</p>
          
          <div className="flex items-center gap-3 bg-[#EBF4F4] px-5 py-3 rounded-2xl border border-[#2E6F6E30]">
            <span className="font-mono text-[28px] font-black text-[#2E6F6E] tracking-widest">
              {careCode || "SM-XXXXXX"}
            </span>
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-[#2E6F6E] text-white text-[13px] font-bold shadow-sm"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="text-[13px] font-semibold text-[#7A7060]">
            Share this code with your caregiver or family doctor so they can link to your app dashboard.
          </p>

          {qrCode && (
            <div className="p-3 bg-white border border-[#D6C9B4] rounded-2xl shadow-sm">
              <img src={qrCode} alt="Care Code QR" className="w-36 h-36" />
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full py-4 rounded-2xl bg-[#FFF0EB] border border-[#C1613D30] text-[#C1613D] font-black text-[18px] transition-all active:scale-95 shadow-sm"
        >
          Sign Out
        </button>
      </div>

      <BambooStrip />
    </div>
  );
}

// ── Screen 9: Auth (Patient & Caregiver Login / Signup) ────────────────────

type AuthRole = "user" | "caregiver";

function AuthForm({
  role,
  onBack,
  onDone,
}: {
  role: AuthRole;
  onBack: () => void;
  onDone: (role: AuthRole, profile: UserProfile) => void;
}) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("70");
  const [language, setLanguage] = useState<Lang>("en");
  const [caregiverRole, setCaregiverRole] = useState("Family Member");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCaregiver = role === "caregiver";
  const accent = isCaregiver ? "#D9A441" : "#2E6F6E";

  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "14px 18px", fontSize: "17px",
    borderRadius: "16px", border: "2px solid #D6C9B4",
    backgroundColor: "#FFFFFF", color: "#2B2B2B", outline: "none",
  };

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      if (isCaregiver) {
        let res: api.AuthResponse;
        if (isLogin) {
          res = await api.caregiverLogin({ email, password });
        } else {
          res = await api.caregiverRegister({ name, email, phone, password, role: caregiverRole as "family" | "health_worker" });
        }
        const c = res.caregiver;
        onDone("caregiver", {
          id: c?.id,
          name: c?.name || name || email,
          email: c?.email || email,
          phone: c?.phone || phone,
          role: c?.role || caregiverRole,
          avatar: c?.avatar || "avatar-1",
          age: "",
        });
      } else {
        let res: api.AuthResponse;
        if (isLogin) {
          res = await api.patientLogin({ phone, password });
        } else {
          res = await api.patientRegister({
            name, phone, password, age: parseInt(age) || 70, language, email: email || undefined,
          });
        }
        const p = res.patient;
        onDone("user", {
          id: p?.id,
          name: p?.name || name || phone,
          phone: p?.phone || phone,
          email: p?.email || email || "",
          age: String(p?.age || age || 70),
          language: p?.language || language,
          careCode: p?.careCode,
          emergencyContact: p?.emergencyContact || "",
          avatar: p?.avatar || "avatar-1",
        });
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-[#FAF6EF]">
      <BambooStrip />
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-md mx-auto w-full gap-6 overflow-y-auto">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white border border-[#D6C9B4]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <p className="text-[13px] font-black uppercase tracking-wider opacity-60">{isCaregiver ? "Caregiver Account" : "Patient Account"}</p>
            <h2 className="text-[26px] font-black text-[#2B2B2B]">{isLogin ? "Welcome back" : "Create account"}</h2>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex p-1.5 rounded-2xl bg-white border border-[#D6C9B4]">
          <button
            onClick={() => { setIsLogin(true); setError(""); }}
            className="flex-1 py-3 rounded-xl font-black text-[16px] transition-all"
            style={{ backgroundColor: isLogin ? accent : "transparent", color: isLogin ? "#FFFFFF" : "#7A7060" }}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(""); }}
            className="flex-1 py-3 rounded-xl font-black text-[16px] transition-all"
            style={{ backgroundColor: !isLogin ? accent : "transparent", color: !isLogin ? "#FFFFFF" : "#7A7060" }}
          >
            Register
          </button>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Full Name</label>
              <input style={fieldStyle} placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}

          {isCaregiver ? (
            <div>
              <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Email Address</label>
              <input style={fieldStyle} type="email" placeholder="caregiver@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          ) : (
            <div>
              <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Phone Number (Primary Identifier)</label>
              <input style={fieldStyle} type="tel" placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          )}

          {!isLogin && isCaregiver && (
            <div>
              <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Phone Number</label>
              <input style={fieldStyle} type="tel" placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          )}

          {!isLogin && !isCaregiver && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Age</label>
                <input style={fieldStyle} type="number" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div>
                <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Language</label>
                <select style={fieldStyle} value={language} onChange={(e) => setLanguage(e.target.value as Lang)}>
                  <option value="en">English</option>
                  <option value="as">Assamese</option>
                  <option value="mn">Manipuri</option>
                </select>
              </div>
            </div>
          )}

          {!isLogin && isCaregiver && (
            <div>
              <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Role / Relationship</label>
              <select style={fieldStyle} value={caregiverRole} onChange={(e) => setCaregiverRole(e.target.value)}>
                <option value="Family Member">Family Member</option>
                <option value="Professional Nurse">Professional Nurse</option>
                <option value="Doctor">Doctor</option>
                <option value="Other Caregiver">Other Caregiver</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-[13px] font-bold text-[#7A7060] block mb-1">Password</label>
            <input style={fieldStyle} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <p className="text-[14px] font-semibold text-[#C1613D] px-1">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-5 rounded-2xl text-[20px] font-black text-white shadow-lg transition-all active:scale-[0.98] mt-2"
          style={{ backgroundColor: accent }}
        >
          {loading ? "Processing..." : isLogin ? "Login →" : "Register →"}
        </button>
      </div>
      <BambooStrip />
    </div>
  );
}

function LoginRegisterScreen({ onDone }: { onDone: (role: AuthRole, profile: UserProfile) => void }) {
  const [role, setRole] = useState<AuthRole | null>(null);

  if (role) {
    return <AuthForm role={role} onBack={() => setRole(null)} onDone={onDone} />;
  }

  return (
    <div className="flex flex-col min-h-full bg-[#FAF6EF]">
      <BambooStrip />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-md mx-auto w-full gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#2E6F6E] shadow-md">
            <span className="font-serif text-[40px] font-bold text-white">স্</span>
          </div>
          <h1 className="text-[36px] font-black text-[#2B2B2B]">Smriti</h1>
          <p className="text-[16px] text-[#7A9B76] font-semibold text-center">Gentle Care &amp; Memory Companion</p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <p className="text-[16px] font-bold text-[#7A7060] text-center uppercase tracking-wider">Select Account Type</p>

          <button
            onClick={() => setRole("user")}
            className="flex items-center gap-5 p-6 rounded-3xl bg-white border-2 border-[#D6C9B4] text-left transition-all active:scale-95 shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#EBF4F4] text-[#2E6F6E] text-[28px]">
              👵
            </div>
            <div>
              <p className="text-[22px] font-black text-[#2B2B2B]">I am a Patient</p>
              <p className="text-[14px] font-semibold text-[#7A7060]">For daily reminders &amp; memory support</p>
            </div>
          </button>

          <button
            onClick={() => setRole("caregiver")}
            className="flex items-center gap-5 p-6 rounded-3xl bg-white border-2 border-[#D6C9B4] text-left transition-all active:scale-95 shadow-sm"
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#FDF3E0] text-[#D9A441] text-[28px]">
              🩺
            </div>
            <div>
              <p className="text-[22px] font-black text-[#2B2B2B]">I am a Caregiver</p>
              <p className="text-[14px] font-semibold text-[#7A7060]">Monitor linked patient care</p>
            </div>
          </button>
        </div>
      </div>
      <BambooStrip />
    </div>
  );
}

// ── Screen 10: Caregiver Dashboard & Patient Management ─────────────────────

function LinkPatientModal({ onClose, onLinked }: { onClose: () => void; onLinked: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 18px", fontSize: "20px",
    borderRadius: "16px", border: "2px solid #D6C9B4",
    backgroundColor: "#FFFFFF", color: "#2B2B2B", outline: "none",
    textAlign: "center", letterSpacing: "4px", textTransform: "uppercase",
  };

  async function handleLink() {
    if (!code.trim()) { setError("Enter Care Code."); return; }
    setError("");
    setLoading(true);

    try {
      await api.linkPatient(code.trim().toUpperCase());
      onLinked();
    } catch (err: any) {
      setError(err.message || "Failed to link patient.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#FAF6EF] rounded-3xl p-6 flex flex-col gap-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[22px] font-black text-[#2B2B2B]">Link Patient with Care Code</h3>
        <p className="text-[14px] text-[#7A7060]">Ask the patient or family for their unique 6-character Care Code (e.g. SM-A1B2C3).</p>

        <div>
          <input
            style={inputStyle}
            placeholder="SM-XXXXXX"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
          />
          {error && <p className="text-[14px] font-semibold text-[#C1613D] mt-2 text-center">{error}</p>}
        </div>

        <div className="flex gap-3 mt-2">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-[#D6C9B4] text-[#7A7060] font-bold">
            Cancel
          </button>
          <button onClick={handleLink} disabled={loading} className="flex-1 py-3.5 rounded-2xl bg-[#D9A441] text-white font-bold shadow-md">
            {loading ? "Linking..." : "Link Patient →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Caregiver Dashboard Components ──────────────────────────────────────────

function getSmoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function MoodTrendChart({ data }: { data: api.MoodTrendPoint[] }) {
  if (!data || data.length === 0) {
    return <p className="text-[14px] text-[#7A7060] italic py-4 text-center">No mood trend data recorded yet.</p>;
  }

  const height = 210;
  const width = 360;
  const leftMargin = 32;
  const rightMargin = 20;
  const topMargin = 22;
  const stepY = 16;
  const bottomGridY = topMargin + 9 * stepY; // score 1 y position = 166

  const points = data.map((d, i) => {
    const x = leftMargin + (i / Math.max(data.length - 1, 1)) * (width - leftMargin - rightMargin);
    const clampedScore = Math.max(1, Math.min(10, d.moodScore));
    const y = topMargin + (10 - clampedScore) * stepY;
    return { x, y, score: d.moodScore, date: d.date };
  });

  const curveD = getSmoothPath(points);
  const firstPt = points[0];
  const lastPt = points[points.length - 1];
  const areaD = `${curveD} L ${lastPt.x} ${bottomGridY} L ${firstPt.x} ${bottomGridY} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 min-w-[300px]">
        <defs>
          <linearGradient id="moodCurveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CA8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8B5CA8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* 10 Grid Lines & Numbered Labels (10 down to 1) */}
        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((val) => {
          const y = topMargin + (10 - val) * stepY;
          return (
            <g key={val}>
              <text x={leftMargin - 6} y={y + 3.5} textAnchor="end" fontSize="10" fontWeight="600" fill="#94A3B8">
                {val}
              </text>
              <line x1={leftMargin} y1={y} x2={width - rightMargin} y2={y} stroke="#E5DEC9" strokeDasharray="3 3" strokeWidth="1" />
            </g>
          );
        })}

        {/* Area Gradient Fill */}
        {points.length > 1 && <path d={areaD} fill="url(#moodCurveGradient)" />}

        {/* Smooth Curved Line */}
        <path d={curveD} fill="none" stroke="#8B5CA8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data Point Nodes and Date Labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill="#8B5CA8" stroke="#FFFFFF" strokeWidth="2.5" />
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#8B5CA8">
              {p.score}
            </text>
            <text x={p.x} y={bottomGridY + 16} textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748B">
              {p.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ThemeBarChart({ themes }: { themes: api.ThemeCount[] }) {
  if (!themes || themes.length === 0) {
    return <p className="text-[14px] text-[#7A7060] italic py-4 text-center">No theme data collected yet.</p>;
  }

  const maxCount = Math.max(...themes.map((t) => t.count), 1);

  return (
    <div className="flex flex-col gap-2">
      {themes.slice(0, 5).map((t) => (
        <div key={t.theme} className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-[#2B2B2B] w-24 sm:w-28 truncate capitalize">{t.theme}</span>
          <div className="flex-1 h-3.5 bg-[#F3EDF8] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8B5CA8] rounded-full transition-all duration-500"
              style={{ width: `${(t.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="text-[12px] font-bold text-[#7A7060] w-6 text-right">{t.count}</span>
        </div>
      ))}
    </div>
  );
}

function AlertCard({ alert }: { alert: api.ChitChatAlert }) {
  const badgeStyles = {
    concern: { bg: "bg-[#FFF0EB]", border: "border-[#C1613D30]", text: "text-[#C1613D]", label: "⚠️ Concern" },
    watch: { bg: "bg-[#FFF9EB]", border: "border-[#D9A44130]", text: "text-[#D9A441]", label: "👁️ Watch" },
    info: { bg: "bg-[#EBF4F4]", border: "border-[#2E6F6E30]", text: "text-[#2E6F6E]", label: "ℹ️ Info" },
  };

  const style = badgeStyles[alert.level] || badgeStyles.info;

  return (
    <div className={`p-4 rounded-2xl ${style.bg} border ${style.border} flex flex-col gap-2`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] sm:text-[12px] font-black uppercase px-2.5 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
          {style.label}
        </span>
        <span className="text-[11px] sm:text-[12px] font-semibold text-[#7A7060]">
          {new Date(alert.date).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <p className="text-[13px] sm:text-[14px] font-bold text-[#2B2B2B] leading-relaxed">{alert.message}</p>
      {alert.moodScore && (
        <span className="text-[12px] font-semibold text-[#7A7060]">
          Mood Score: <strong className="text-[#8B5CA8]">{alert.moodScore}/10</strong>
        </span>
      )}
    </div>
  );
}

// ── Caregiver Profile Modal ──────────────────────────────────────────────────

function CaregiverProfileModal({
  onClose,
  onLogout,
}: {
  onClose: () => void;
  onLogout: () => void;
}) {
  const [profile, setProfile] = useState<api.CaregiverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fetchCaregiverProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-[#D6C9B4] shadow-xl flex flex-col gap-4 sm:gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#D6C9B430] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF4F4] text-[#2E6F6E] flex items-center justify-center font-bold text-xl">🩺</div>
            <div>
              <h3 className="text-[18px] sm:text-[20px] font-black text-[#2B2B2B]">Caregiver Profile</h3>
              <p className="text-[12px] font-bold text-[#7A7060]">Smriti Portal Account</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF6EF] text-[#7A7060] font-bold hover:bg-[#EBF4F4]">✕</button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[#7A7060] font-bold">Loading profile...</div>
        ) : profile ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF6EF] border border-[#D6C9B430]">
              <div className="w-14 h-14 rounded-2xl bg-[#2E6F6E] text-white text-[24px] font-black flex items-center justify-center shadow-sm flex-shrink-0">
                {profile.name ? profile.name[0].toUpperCase() : "C"}
              </div>
              <div className="min-w-0">
                <h4 className="text-[18px] font-black text-[#2B2B2B] truncate">{profile.name}</h4>
                <span className="text-[11px] font-black uppercase text-[#2E6F6E] bg-[#EBF4F4] px-2.5 py-0.5 rounded-full border border-[#2E6F6E20]">
                  {profile.role ? profile.role.replace("_", " ") : "Caregiver"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-[13px] sm:text-[14px] font-medium text-[#2B2B2B]">
              <div className="flex justify-between py-2 border-b border-[#D6C9B430] gap-2">
                <span className="text-[#7A7060] font-bold">Email</span>
                <span className="font-semibold truncate">{profile.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#D6C9B430] gap-2">
                <span className="text-[#7A7060] font-bold">Phone</span>
                <span className="font-semibold">{profile.phone}</span>
              </div>
              <div className="flex justify-between py-2 gap-2">
                <span className="text-[#7A7060] font-bold">Role</span>
                <span className="font-semibold capitalize">{profile.role ? profile.role.replace("_", " ") : "Caregiver"}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-[#7A7060] py-4 text-center">Caregiver profile details unavailable.</p>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onLogout} className="flex-1 py-3 rounded-2xl bg-[#FFF0EB] border border-[#C1613D30] text-[#C1613D] font-bold text-[14px]">
            Logout
          </button>
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-[#2E6F6E] text-white font-bold text-[14px] shadow-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Redesigned Caregiver Dashboard ──────────────────────────────────────────

function CaregiverDashboard({ onLogout }: { onLogout: () => void }) {
  const [patients, setPatients] = useState<api.LinkedPatient[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [deletingReminderId, setDeletingReminderId] = useState<number | null>(null);

  // Dedicated section state: "dashboard" | "games" | "analysis" | "alerts" | "reminders"
  const [activeSection, setActiveSection] = useState<"dashboard" | "games" | "analysis" | "alerts" | "reminders">("dashboard");

  const [activities, setActivities] = useState<api.ApiActivityLog[]>([]);
  const [patientReminders, setPatientReminders] = useState<api.ApiReminder[]>([]);

  // Chit-Chat analysis states
  const [analysis, setAnalysis] = useState<api.ChitChatAnalysis | null>(null);
  const [sessions, setSessions] = useState<api.ChitChatSessionDetail[]>([]);
  const [alerts, setAlerts] = useState<api.ChitChatAlert[]>([]);
  const [showTranscripts, setShowTranscripts] = useState(false);

  const loadPatients = () => {
    api.fetchLinkedPatients()
      .then((data) => {
        setPatients(data);
        if (data.length > 0) setActiveIndex((prev) => (prev >= data.length ? 0 : prev));
      })
      .catch(() => {});
  };

  useEffect(() => { loadPatients(); }, []);

  const activePatient = patients[activeIndex];

  useEffect(() => {
    if (!activePatient) return;

    api.fetchPatientActivity(activePatient.id)
      .then(setActivities)
      .catch(() => {});

    api.fetchPatientReminders(activePatient.id)
      .then(setPatientReminders)
      .catch(() => {});

    Promise.all([
      api.fetchChitChatAnalysis(activePatient.id).then(setAnalysis).catch(() => {}),
      api.fetchChitChatSessions(activePatient.id, 10).then((res) => setSessions(res.sessions)).catch(() => {}),
      api.fetchChitChatAlerts(activePatient.id).then((res) => setAlerts(res.alerts)).catch(() => {}),
    ]);

    const unsubscribe = subscribeSync((payload) => {
      if (payload.patientId === activePatient.id && payload.entity === "reminder") {
        if (payload.action === "created") {
          setPatientReminders((prev) => [payload.data, ...prev.filter((r) => r.id !== payload.data.id)]);
        } else if (payload.action === "updated") {
          setPatientReminders((prev) => prev.map((r) => (r.id === payload.data.id ? { ...r, ...payload.data } : r)));
        } else if (payload.action === "deleted") {
          setPatientReminders((prev) => prev.filter((r) => r.id !== payload.data.id));
        }
      } else if (payload.patientId === activePatient.id && payload.entity === "activity" && payload.action === "created") {
        setActivities((prev) => [payload.data, ...prev]);
      } else if (payload.entity === "link") {
        loadPatients();
      }
    });
    return unsubscribe;
  }, [activePatient?.id]);

  function handleAddReminderForPatient(data: api.CreateReminderPayload) {
    if (!activePatient) return;
    api.addReminderForPatient(activePatient.id, data)
      .then((newReminder) => {
        setPatientReminders((prev) => [newReminder, ...prev.filter((r) => r.id !== newReminder.id)]);
        setShowAddReminderModal(false);
      })
      .catch((err) => alert(err.message));
  }

  function handleDeleteReminderForPatient(id: number) {
    if (!activePatient) return;
    api.deletePatientReminder(activePatient.id, id)
      .then(() => {
        setPatientReminders((prev) => prev.filter((r) => r.id !== id));
        setDeletingReminderId(null);
      })
      .catch((err) => alert(err.message));
  }

  function handleUnlink(patientId: number) {
    if (!confirm("Are you sure you want to unlink this patient?")) return;
    api.unlinkPatient(patientId)
      .then(() => loadPatients())
      .catch((err) => alert(err.message));
  }

  // Filter game logs for Game Results card
  const gameActivities = activities.filter((a) => a.type === "game");

  const mindsnapLogs = gameActivities.filter((act) => {
    const g = (act.payload as any)?.game || (act.payload as any)?.title || "";
    return g.toLowerCase().includes("mindsnap");
  });

  const smritiTaalLogs = gameActivities.filter((act) => {
    const g = (act.payload as any)?.game || (act.payload as any)?.title || "";
    return g.toLowerCase().includes("smriti");
  });

  const sangaLogs = gameActivities.filter((act) => {
    const g = (act.payload as any)?.game || (act.payload as any)?.title || "";
    return g.toLowerCase().includes("sanga");
  });

  const matchPairsLogs = gameActivities.filter((act) => {
    const g = (act.payload as any)?.game || (act.payload as any)?.title || "";
    return !g.toLowerCase().includes("mindsnap") && !g.toLowerCase().includes("smriti") && !g.toLowerCase().includes("sanga");
  });

  const mindsnapStats = loadMindsnapStats();
  const mindsnapBestScore = mindsnapLogs.length > 0
    ? Math.max(...mindsnapLogs.map((a) => Number((a.payload as any)?.score || 0)), mindsnapStats.best)
    : mindsnapStats.best;

  const mindsnapAccuracy = mindsnapStats.attempts > 0
    ? Math.round((mindsnapStats.hits / mindsnapStats.attempts) * 100)
    : mindsnapLogs.length > 0
    ? Math.round(mindsnapLogs.reduce((acc, a) => acc + Number((a.payload as any)?.accuracy || 80), 0) / mindsnapLogs.length)
    : 0;

  const smritiTaalScores = smritiTaalLogs.map((a) => Number((a.payload as any)?.score || 0));
  const smritiTaalBestScore = smritiTaalScores.length > 0 ? Math.max(...smritiTaalScores) : 0;
  const smritiTaalAvgAcc = smritiTaalLogs.length > 0
    ? Math.round(smritiTaalLogs.reduce((acc, a) => acc + Number((a.payload as any)?.accuracy || 0), 0) / smritiTaalLogs.length)
    : 0;

  const sangaScores = sangaLogs.map((a) => Number((a.payload as any)?.score || 0));
  const sangaBestScore = sangaScores.length > 0 ? Math.max(...sangaScores) : 0;
  const sangaAvgAcc = sangaLogs.length > 0
    ? Math.round(sangaLogs.reduce((acc, a) => acc + Number((a.payload as any)?.accuracy || 0), 0) / sangaLogs.length)
    : 0;

  const matchPairsScores = matchPairsLogs.map((a) => Number((a.payload as any)?.score || 0));
  const matchPairsBestScore = matchPairsScores.length > 0 ? Math.max(...matchPairsScores) : 0;
  const matchPairsAvgScore = matchPairsScores.length > 0 ? Math.round(matchPairsScores.reduce((a, b) => a + b, 0) / matchPairsScores.length) : 0;

  return (
    <div className="flex flex-col min-h-full bg-[#F7F4EE]">
      {showProfileModal && (
        <CaregiverProfileModal onClose={() => setShowProfileModal(false)} onLogout={onLogout} />
      )}
      {showLinkModal && (
        <LinkPatientModal onClose={() => setShowLinkModal(false)} onLinked={() => { setShowLinkModal(false); loadPatients(); }} />
      )}
      {showAddReminderModal && activePatient && (
        <AddReminderModal onClose={() => setShowAddReminderModal(false)} onAdd={handleAddReminderForPatient} />
      )}
      {deletingReminderId !== null && activePatient && (
        <ConfirmDeleteModal
          title="Delete Patient Reminder?"
          message="Are you sure you want to delete this reminder for the patient?"
          onClose={() => setDeletingReminderId(null)}
          onConfirm={() => handleDeleteReminderForPatient(deletingReminderId)}
        />
      )}

      {/* Navbar Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 bg-[#1E3F35] text-white shadow-xs gap-2">
        {/* Left: App Logo & Name */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white text-lg font-bold">
            🌿
          </div>
          <div className="hidden min-[360px]:block">
            <h1 className="text-[17px] font-black tracking-tight leading-none text-white">Smriti</h1>
            <p className="text-[9px] font-bold text-emerald-200/80 uppercase tracking-widest mt-0.5">CAREGIVER PORTAL</p>
          </div>
        </div>

        {/* Center: Patient Capsule Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#143028] hover:bg-[#0E241E] border border-white/15 transition-all text-white text-xs font-semibold shadow-xs"
          >
            <span className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-[9px] flex-shrink-0">
              🟡
            </span>
            <span className="max-w-[80px] min-[400px]:max-w-[130px] sm:max-w-[180px] truncate">
              {activePatient ? activePatient.name : "Select Patient"}
            </span>
            <span className="text-[10px] text-white/70 ml-0.5">{dropdownOpen ? "▲" : "v"}</span>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white text-[#1E293B] rounded-2xl border border-[#EBE4D8] shadow-xl z-40 overflow-hidden animate-fadeIn">
              <div className="p-2.5 border-b border-[#F0E8D5] bg-[#FAF6EF]">
                <p className="text-[10px] font-black uppercase text-[#94A3B8] tracking-wider px-2 py-0.5">Linked Patients</p>
              </div>

              <div className="max-h-48 overflow-y-auto p-1.5 flex flex-col gap-1">
                {patients.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveIndex(i);
                      setDropdownOpen(false);
                      setActiveSection("dashboard");
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeIndex === i ? "bg-[#1E3F35] text-white" : "hover:bg-[#F7F4EE] text-[#1E293B]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>👵</span>
                      <span className="truncate">{p.name}</span>
                    </div>
                    {activeIndex === i && <span className="text-[11px]">✓</span>}
                  </button>
                ))}

                {patients.length === 0 && (
                  <p className="text-xs text-[#94A3B8] p-3 text-center">No patients linked yet</p>
                )}
              </div>

              {/* Add Patient Option */}
              <div className="p-2 border-t border-[#F0E8D5] bg-[#FAF6EF]">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowLinkModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#D9A441] text-white font-bold text-xs shadow-xs hover:bg-[#c49237]"
                >
                  <span>+ Link New Patient</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Profile Option */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 text-white/90 hover:text-white text-xs font-semibold transition-all"
          >
            <span>👤 Profile</span>
          </button>
        </div>
      </div>

      {/* Main Content Canvas */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 max-w-5xl mx-auto w-full flex flex-col gap-5">
        {patients.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-[#EBE4D8] p-6 sm:p-8 shadow-xs">
            <span className="text-4xl sm:text-5xl">👵</span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1E293B] mt-2">No Patients Linked</h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-2 max-w-md mx-auto">
              Link to your patient using their 6-character Care Code from the patient app to view analysis, game scores, and set reminders.
            </p>
            <button
              onClick={() => setShowLinkModal(true)}
              className="mt-5 px-6 py-2.5 rounded-xl bg-[#1E3F35] text-white font-bold text-sm shadow-xs hover:bg-[#143028]"
            >
              + Link Patient Now
            </button>
          </div>
        ) : activePatient && (
          <>
            {/* Active Patient Overview Header Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#EBE4D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-14 h-14 rounded-2xl bg-[#FAF5E6] border border-[#F0E8D5] flex items-center justify-center text-3xl flex-shrink-0">
                  👵
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] truncate">{activePatient.name}</h2>
                    <span className="text-[11px] font-bold uppercase text-[#64748B] bg-[#F1ECE4] px-2.5 py-0.5 rounded-md border border-[#E2DBCB] tracking-wider whitespace-nowrap">
                      CODE: {activePatient.careCode}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#64748B] mt-1 leading-normal">
                    Age: {activePatient.age} · Lang: {(activePatient.language || "EN").toUpperCase()} · Phone: {activePatient.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleUnlink(activePatient.id)}
                className="self-end sm:self-auto px-4 py-1.5 rounded-lg text-xs font-bold text-[#EF4444] border border-[#FCA5A5] hover:bg-[#FEF2F2] transition-colors whitespace-nowrap"
              >
                Unlink
              </button>
            </div>

            {/* Dedicated section back banner if sub-screen active */}
            {activeSection !== "dashboard" && (
              <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between bg-white px-5 py-3 rounded-2xl border border-[#EBE4D8] shadow-xs gap-2.5">
                <button
                  onClick={() => setActiveSection("dashboard")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7F4EE] hover:bg-[#1E3F35] hover:text-white text-[#1E3F35] font-bold text-xs sm:text-sm transition-all self-start"
                >
                  <span>← Back to Dashboard</span>
                </button>
                <span className="text-xs sm:text-sm font-bold text-[#1E293B]">
                  {activeSection === "games" && "🎮 Game Results Detailed View"}
                  {activeSection === "analysis" && "🎙️ Chit-Chat AI Analysis View"}
                  {activeSection === "alerts" && "🚨 Risk Alerts Detailed View"}
                  {activeSection === "reminders" && "⏰ Reminders Management View"}
                </span>
              </div>
            )}

            {/* MAIN DASHBOARD HOMEPAGE */}
            {activeSection === "dashboard" && (
              <>
                {/* 4 Action Cards Grid (2x2 Parallel) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CARD 1: Game Results */}
                  <button
                    onClick={() => setActiveSection("games")}
                    className="bg-white p-5 rounded-2xl border border-[#EBE4D8] hover:border-[#9333EA]/40 flex items-center justify-between shadow-xs transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                      <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center font-bold text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                        💜
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-[#1E293B] group-hover:text-[#9333EA] transition-colors leading-tight">
                            Game Results
                          </h3>
                          <span className="text-[11px] font-bold text-[#3B82F6] bg-[#EFF6EF] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            {gameActivities.length} played
                          </span>
                        </div>
                        <p className="text-xs font-normal text-[#94A3B8] mt-1 truncate">
                          {gameActivities.length > 0
                            ? `Latest Score: ${(gameActivities[0].payload as any)?.score ?? "Completed"}`
                            : "No game logs recorded yet"}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-[#E2E8F0] group-hover:border-[#9333EA] group-hover:text-[#9333EA] text-[#94A3B8] font-bold text-sm flex items-center justify-center transition-colors flex-shrink-0">
                      →
                    </div>
                  </button>

                  {/* CARD 2: Chit-Chat Analysis */}
                  <button
                    onClick={() => setActiveSection("analysis")}
                    className="bg-white p-5 rounded-2xl border border-[#EBE4D8] hover:border-[#9333EA]/40 flex items-center justify-between shadow-xs transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                      <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center font-bold text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                        🎙️
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-[#1E293B] group-hover:text-[#9333EA] transition-colors leading-tight">
                            Chit-Chat Analysis
                          </h3>
                          {analysis?.latestReport?.moodScore && (
                            <span className="text-[11px] font-bold text-[#9333EA] bg-[#F3E8FF] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                              Mood: {analysis.latestReport.moodScore}/10
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-normal text-[#94A3B8] mt-1 truncate">
                          {analysis?.latestReport ? analysis.latestReport.summaryBullets[0] || "View detailed AI takeaways" : "No sessions analyzed"}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-[#E2E8F0] group-hover:border-[#9333EA] group-hover:text-[#9333EA] text-[#94A3B8] font-bold text-sm flex items-center justify-center transition-colors flex-shrink-0">
                      →
                    </div>
                  </button>

                  {/* CARD 3: Risk Alerts */}
                  <button
                    onClick={() => setActiveSection("alerts")}
                    className="bg-white p-5 rounded-2xl border border-[#EBE4D8] hover:border-[#EF4444]/40 flex items-center justify-between shadow-xs transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                      <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center font-bold text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                        🚨
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-[#1E293B] group-hover:text-[#EF4444] transition-colors leading-tight">
                            Risk Alerts
                          </h3>
                          <span className="text-[11px] font-bold text-[#EF4444] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full whitespace-nowrap border border-[#FCA5A5]/30">
                            {alerts.length} alerts
                          </span>
                        </div>
                        <p className="text-xs font-normal text-[#94A3B8] mt-1 truncate">
                          {alerts.length > 0 ? alerts[0].message : "No risk warnings flagged"}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-[#E2E8F0] group-hover:border-[#EF4444] group-hover:text-[#EF4444] text-[#94A3B8] font-bold text-sm flex items-center justify-center transition-colors flex-shrink-0">
                      →
                    </div>
                  </button>

                  {/* CARD 4: Reminders */}
                  <button
                    onClick={() => setActiveSection("reminders")}
                    className="bg-white p-5 rounded-2xl border border-[#EBE4D8] hover:border-[#D97706]/40 flex items-center justify-between shadow-xs transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                      <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                        ⏰
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-[#1E293B] group-hover:text-[#D97706] transition-colors leading-tight">
                            Reminders
                          </h3>
                          <span className="text-[11px] font-bold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full whitespace-nowrap border border-[#FDE68A]">
                            {patientReminders.length} active
                          </span>
                        </div>
                        <p className="text-xs font-normal text-[#94A3B8] mt-1 truncate">
                          {patientReminders.length > 0 ? `${patientReminders[0].title} (${patientReminders[0].time})` : "No scheduled reminders"}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-[#E2E8F0] group-hover:border-[#D97706] group-hover:text-[#D97706] text-[#94A3B8] font-bold text-sm flex items-center justify-center transition-colors flex-shrink-0">
                      →
                    </div>
                  </button>
                </div>

                {/* Mood Score Trend Card */}
                <div className="bg-white p-5 rounded-2xl border border-[#EBE4D8] flex flex-col gap-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-lg flex-shrink-0">
                      📈
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1E293B]">Mood Score Trend</h3>
                      <p className="text-xs font-normal text-[#94A3B8]">Historical emotional tracking scale (1–10)</p>
                    </div>
                  </div>

                  {/* Inner Dashed Container */}
                  <div className="bg-[#FAF8F5] border border-dashed border-[#E5DEC9] rounded-xl p-5 flex flex-col justify-between min-h-[170px]">
                    <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-semibold mb-2">
                      <span>Score 10</span>
                      <span>Score 1</span>
                    </div>

                    {analysis?.moodTrend && analysis.moodTrend.length > 0 ? (
                      <MoodTrendChart data={analysis.moodTrend} />
                    ) : (
                      <div className="my-auto py-6 text-center">
                        <p className="text-[#94A3B8] text-xs font-normal">No mood trend data recorded yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Activity Stream Card */}
                <div className="bg-white p-5 rounded-2xl border border-[#EBE4D8] flex flex-col gap-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center font-bold text-lg flex-shrink-0">
                      🕒
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1E293B]">Patient Activity Stream</h3>
                      <p className="text-xs font-normal text-[#94A3B8]">Real-time patient actions and check-ins</p>
                    </div>
                  </div>

                  {/* Inner Dashed Container */}
                  <div className="bg-[#FAF8F5] border border-dashed border-[#E5DEC9] rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[170px]">
                    {activities.length === 0 ? (
                      <>
                        <div className="w-9 h-9 rounded-lg bg-[#F1ECE4] text-[#94A3B8] flex items-center justify-center mb-2 text-base">
                          📥
                        </div>
                        <p className="text-[#475569] text-xs sm:text-sm font-bold">No actions recorded today</p>
                        <p className="text-[#94A3B8] text-[11px] sm:text-xs mt-1 max-w-sm">
                          Patient interactions and caregiver check-ins will appear chronologically here.
                        </p>
                      </>
                    ) : (
                      <div className="w-full flex flex-col gap-2.5 text-left max-h-[440px] overflow-y-auto pr-1">
                        {activities.slice(0, 10).map((act) => (
                          <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#EBE4D8] shadow-xs">
                            <span className="text-xl flex-shrink-0">
                              {act.type === "game" ? "🎮" : act.type === "mood_checkin" ? "😊" : "💊"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs sm:text-sm font-bold text-[#1E293B] capitalize">{act.type.replace("_", " ")}</p>
                                <span className="text-[11px] font-medium text-[#94A3B8]">
                                  {new Date(act.createdAt || (act as any).timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-[#64748B] mt-0.5 break-words">
                                {typeof act.payload === "string" ? act.payload : JSON.stringify(act.payload)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* DEDICATED SCREEN 1: GAME RESULTS DETAILED VIEW */}
            {activeSection === "games" && (
              <div className="flex flex-col gap-6">
                {/* SECTION 1: MINDSNAP MEMORY ARCADE */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#D6C9B4] flex flex-col gap-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D6C9B430] pb-3.5 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7567f8] text-xl flex items-center justify-center font-black flex-shrink-0">
                        ⚡
                      </div>
                      <div>
                        <h4 className="text-lg sm:text-xl font-black text-[#2B2B2B]">Mindsnap Memory Arcade</h4>
                        <p className="text-xs font-semibold text-[#7A7060]">Visual pattern recall performance</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#7567f8] bg-[#F3E8FF] px-3.5 py-1 rounded-full self-start sm:self-auto border border-[#7567f820]">
                      {mindsnapLogs.length} Sessions Played
                    </span>
                  </div>

                  {/* Top Stats Cards for Mindsnap */}
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-[#7A7060] tracking-wider mb-2.5">Overall Mindsnap Performance</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#56d8d0]">{mindsnapStats.games || mindsnapLogs.length}</b>
                        <span className="text-xs font-bold text-[#7A7060]">Games played</span>
                      </div>
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#7567f8]">{mindsnapAccuracy}%</b>
                        <span className="text-xs font-bold text-[#7A7060]">Recall accuracy</span>
                      </div>
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#ffd166]">{mindsnapBestScore}</b>
                        <span className="text-xs font-bold text-[#7A7060]">Best score</span>
                      </div>
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#ff6fae]">{mindsnapStats.streak || (mindsnapLogs.length > 0 ? 1 : 0)} day{mindsnapStats.streak === 1 ? "" : "s"}</b>
                        <span className="text-xs font-bold text-[#7A7060]">Play streak</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Latest 2 Logs for Mindsnap */}
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-[#7A7060] tracking-wider mb-2.5">Latest 2 Session Logs</h5>
                    {mindsnapLogs.length === 0 ? (
                      <div className="p-6 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E5DEC9]">
                        <p className="text-xs font-semibold text-[#7A7060]">No Mindsnap game logs recorded yet.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {mindsnapLogs.slice(0, 2).map((act) => (
                          <div key={act.id} className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF6EF] border border-[#D6C9B430] flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-2.5 shadow-xs">
                            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F3E8FF] text-[#7567f8] flex items-center justify-center text-lg font-black flex-shrink-0">
                                ⚡
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] sm:text-[15px] font-black text-[#2B2B2B] truncate">
                                  Mindsnap
                                </p>
                                <p className="text-[12px] sm:text-[13px] font-semibold text-[#7A7060]">
                                  Played on {new Date(act.createdAt || Date.now()).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <span className="text-[13px] sm:text-[14px] font-black text-[#7A9B76] bg-[#EEF4EE] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-[#7A9B7630] self-start min-[480px]:self-auto">
                              Score: {(act.payload as any)?.score ?? 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: MATCH THE PAIRS */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#D6C9B4] flex flex-col gap-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D6C9B430] pb-3.5 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#059669] text-xl flex items-center justify-center font-black flex-shrink-0">
                        🧩
                      </div>
                      <div>
                        <h4 className="text-lg sm:text-xl font-black text-[#2B2B2B]">Match the Pairs Memory Game</h4>
                        <p className="text-xs font-semibold text-[#7A7060]">Visual card pairing & memory recognition</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#059669] bg-[#ECFDF5] px-3.5 py-1 rounded-full self-start sm:self-auto border border-[#05966920]">
                      {matchPairsLogs.length} Sessions Played
                    </span>
                  </div>

                  {/* Top Stats Cards for Match Pairs */}
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-[#7A7060] tracking-wider mb-2.5">Overall Match Pairs Performance</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#059669]">{matchPairsLogs.length}</b>
                        <span className="text-xs font-bold text-[#7A7060]">Games played</span>
                      </div>
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#d97706]">{matchPairsBestScore}</b>
                        <span className="text-xs font-bold text-[#7A7060]">Best score</span>
                      </div>
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#7567f8]">{matchPairsAvgScore}</b>
                        <span className="text-xs font-bold text-[#7A7060]">Avg score</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Latest 2 Logs for Match Pairs */}
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-[#7A7060] tracking-wider mb-2.5">Latest 2 Session Logs</h5>
                    {matchPairsLogs.length === 0 ? (
                      <div className="p-6 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E5DEC9]">
                        <p className="text-xs font-semibold text-[#7A7060]">No Match the Pairs game logs recorded yet.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {matchPairsLogs.slice(0, 2).map((act) => (
                          <div key={act.id} className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF6EF] border border-[#D6C9B430] flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-2.5 shadow-xs">
                            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#EBF4F4] text-[#2E6F6E] flex items-center justify-center text-lg font-black flex-shrink-0">
                                🧩
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] sm:text-[15px] font-black text-[#2B2B2B] truncate">
                                  Match_pairs
                                </p>
                                <p className="text-[12px] sm:text-[13px] font-semibold text-[#7A7060]">
                                  Played on {new Date(act.createdAt || Date.now()).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <span className="text-[13px] sm:text-[14px] font-black text-[#7A9B76] bg-[#EEF4EE] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-[#7A9B7630] self-start min-[480px]:self-auto">
                              {(act.payload as any)?.score != null ? `Score: ${(act.payload as any).score}` : "Completed ✓"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 3: SMRITI TAAL RHYTHM & SOUND MEMORY */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#D6C9B4] flex flex-col gap-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D6C9B430] pb-3.5 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E2EFEB] text-[#2F6B62] text-xl flex items-center justify-center font-black flex-shrink-0">
                        🥁
                      </div>
                      <div>
                        <h4 className="text-lg sm:text-xl font-black text-[#2B2B2B]">Smriti Taal — Rhythm Arcade</h4>
                        <p className="text-xs font-semibold text-[#7A7060]">Audio-visual rhythm & instrument sequence recall</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#2F6B62] bg-[#E2EFEB] px-3.5 py-1 rounded-full self-start sm:self-auto border border-[#2F6B6220]">
                      {smritiTaalLogs.length} Sessions Played
                    </span>
                  </div>

                  {/* Top Stats Cards for Smriti Taal */}
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-[#7A7060] tracking-wider mb-2.5">Overall Smriti Taal Performance</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#2F6B62]">{smritiTaalLogs.length}</b>
                        <span className="text-xs font-bold text-[#7A7060]">Games played</span>
                      </div>
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#DB7B25]">{smritiTaalBestScore}</b>
                        <span className="text-xs font-bold text-[#7A7060]">Best score</span>
                      </div>
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#3B8B6B]">{smritiTaalAvgAcc}%</b>
                        <span className="text-xs font-bold text-[#7A7060]">Avg accuracy</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Latest 2 Logs for Smriti Taal */}
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-[#7A7060] tracking-wider mb-2.5">Latest 2 Session Logs</h5>
                    {smritiTaalLogs.length === 0 ? (
                      <div className="p-6 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E5DEC9]">
                        <p className="text-xs font-semibold text-[#7A7060]">No Smriti Taal game logs recorded yet.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {smritiTaalLogs.slice(0, 2).map((act) => (
                          <div key={act.id} className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF6EF] border border-[#D6C9B430] flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-2.5 shadow-xs">
                            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#E2EFEB] text-[#2F6B62] flex items-center justify-center text-lg font-black flex-shrink-0">
                                🥁
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] sm:text-[15px] font-black text-[#2B2B2B] truncate">
                                  Smriti Taal
                                </p>
                                <p className="text-[12px] sm:text-[13px] font-semibold text-[#7A7060]">
                                  Played on {new Date(act.createdAt || Date.now()).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start min-[480px]:self-auto">
                              {(act.payload as any)?.accuracy != null && (
                                <span className="text-[12px] sm:text-[13px] font-black text-[#2F6B62] bg-[#E2EFEB] px-3 py-1.5 rounded-xl border border-[#2F6B6220]">
                                  {(act.payload as any).accuracy}% Acc
                                </span>
                              )}
                              <span className="text-[13px] sm:text-[14px] font-black text-[#7A9B76] bg-[#EEF4EE] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-[#7A9B7630]">
                                {(act.payload as any)?.score != null ? `Score: ${(act.payload as any).score}` : "Completed ✓"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 4: SANGA MEMORY & RECALL */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#D6C9B4] flex flex-col gap-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D6C9B430] pb-3.5 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EAEEE1] text-[#2F6B4F] text-xl flex items-center justify-center font-black flex-shrink-0">
                        🧠
                      </div>
                      <div>
                        <h4 className="text-lg sm:text-xl font-black text-[#2B2B2B]">Sanga Memory & Recall</h4>
                        <p className="text-xs font-semibold text-[#7A7060]">Adaptive multi-category object & sequence memory</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#2F6B4F] bg-[#EAEEE1] px-3.5 py-1 rounded-full self-start sm:self-auto border border-[#2F6B4F20]">
                      {sangaLogs.length} Sessions Played
                    </span>
                  </div>

                  {/* Top Stats Cards for Sanga Memory */}
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-[#7A7060] tracking-wider mb-2.5">Overall Sanga Memory Performance</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#2F6B4F]">{sangaLogs.length}</b>
                        <span className="text-xs font-bold text-[#7A7060]">Games played</span>
                      </div>
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#C98F2A]">{sangaBestScore}</b>
                        <span className="text-xs font-bold text-[#7A7060]">Best score</span>
                      </div>
                      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border border-[#E5DEC9] shadow-xs">
                        <b className="block text-2xl font-black text-[#3B8B6B]">{sangaAvgAcc}%</b>
                        <span className="text-xs font-bold text-[#7A7060]">Avg accuracy</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Latest 2 Logs for Sanga Memory */}
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-[#7A7060] tracking-wider mb-2.5">Latest 2 Session Logs</h5>
                    {sangaLogs.length === 0 ? (
                      <div className="p-6 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E5DEC9]">
                        <p className="text-xs font-semibold text-[#7A7060]">No Sanga Memory game logs recorded yet.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {sangaLogs.slice(0, 2).map((act) => (
                          <div key={act.id} className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF6EF] border border-[#D6C9B430] flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-2.5 shadow-xs">
                            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#EAEEE1] text-[#2F6B4F] flex items-center justify-center text-lg font-black flex-shrink-0">
                                🧠
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] sm:text-[15px] font-black text-[#2B2B2B] truncate">
                                  Sanga Memory
                                </p>
                                <p className="text-[12px] sm:text-[13px] font-semibold text-[#7A7060]">
                                  Played on {new Date(act.createdAt || Date.now()).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start min-[480px]:self-auto">
                              {(act.payload as any)?.level != null && (
                                <span className="text-[12px] sm:text-[13px] font-black text-[#2F6B4F] bg-[#EAEEE1] px-3 py-1.5 rounded-xl border border-[#2F6B4F20]">
                                  Lvl {(act.payload as any).level}
                                </span>
                              )}
                              {(act.payload as any)?.accuracy != null && (
                                <span className="text-[12px] sm:text-[13px] font-black text-[#2F6B4F] bg-[#EAEEE1] px-3 py-1.5 rounded-xl border border-[#2F6B4F20]">
                                  {(act.payload as any).accuracy}% Acc
                                </span>
                              )}
                              <span className="text-[13px] sm:text-[14px] font-black text-[#7A9B76] bg-[#EEF4EE] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-[#7A9B7630]">
                                {(act.payload as any)?.score != null ? `Score: ${(act.payload as any).score}` : "Completed ✓"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DEDICATED SCREEN 2: CHIT-CHAT ANALYSIS */}
            {activeSection === "analysis" && (
              <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#D6C9B4] flex flex-col gap-5 sm:gap-6 shadow-sm">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D6C9B430] pb-3.5 sm:pb-4 gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F3EDF8] text-[#8B5CA8] text-[26px] flex items-center justify-center font-bold flex-shrink-0">
                      🎙️
                    </div>
                    <div>
                      <h3 className="text-[18px] sm:text-[22px] font-black text-[#2B2B2B]">Chit-Chat Detailed AI Report</h3>
                      <p className="text-[12px] sm:text-[13px] font-bold text-[#7A7060]">Speech analysis, emotional sentiment, and spoken transcripts</p>
                    </div>
                  </div>
                  {analysis?.latestReport?.moodScore && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-[13px] sm:text-[14px] font-black text-[#8B5CA8] bg-[#F3EDF8] px-3.5 py-1.5 rounded-full border border-[#8B5CA830]">
                        Mood Score: {analysis.latestReport.moodScore}/10
                      </span>
                    </div>
                  )}
                </div>

                {analysis?.latestReport ? (
                  <div className="flex flex-col gap-5 sm:gap-6">
                    {/* 3 Metric Overview Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {/* Stat 1: Mood & Sentiment */}
                      <div className="p-4 rounded-2xl bg-[#F9F6FC] border border-[#8B5CA830] flex flex-col gap-1">
                        <span className="text-[11px] font-black uppercase text-[#8B5CA8] tracking-wider">Mood & Sentiment</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-[26px] font-black text-[#8B5CA8]">{analysis.latestReport.moodScore}<span className="text-[14px] font-bold text-[#7A7060]">/10</span></span>
                          <span className="text-[12px] font-bold text-[#8B5CA8] capitalize bg-[#F3EDF8] px-2 py-0.5 rounded-md">
                            {analysis.latestReport.moodScore >= 7 ? "Positive" : analysis.latestReport.moodScore >= 5 ? "Neutral" : "Low"}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-[#7A7060] mt-0.5">Emotional tone & mood assessment</p>
                      </div>

                      {/* Stat 2: Speech & Response Depth */}
                      <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#D6C9B430] flex flex-col gap-1">
                        <span className="text-[11px] font-black uppercase text-[#7A7060] tracking-wider">Speech & Response Depth</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-[22px] font-black text-[#2B2B2B]">
                            {analysis.latestReport.responseLength != null ? `${analysis.latestReport.responseLength} words` : "Normal Depth"}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-[#7A7060] mt-0.5">Average verbal response verbosity</p>
                      </div>

                      {/* Stat 3: Cognitive Risk Status */}
                      <div className="p-4 rounded-2xl bg-[#EEF4EE] border border-[#7A9B7630] flex flex-col gap-1">
                        <span className="text-[11px] font-black uppercase text-[#7A9B76] tracking-wider">Safety Status</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[18px]">🌿</span>
                          <span className="text-[16px] font-black text-[#7A9B76]">
                            {alerts.length === 0 ? "LOW RISK" : `${alerts.length} ALERTS`}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-[#7A7060] mt-0.5">Behavioral & disorientation check</p>
                      </div>
                    </div>

                    {/* Key AI Clinical Takeaways */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#F9F6FC] border border-[#8B5CA830] flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[20px]">🤖</span>
                        <h4 className="text-[14px] sm:text-[15px] font-black uppercase text-[#8B5CA8] tracking-wider">Key AI Takeaways & Insights</h4>
                      </div>
                      <ul className="list-disc list-inside flex flex-col gap-2 text-[13px] sm:text-[15px] font-medium text-[#2B2B2B] leading-relaxed pl-1">
                        {analysis.latestReport.summaryBullets.map((bullet, idx) => (
                          <li key={idx} className="marker:text-[#8B5CA8]">{bullet}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Top Conversation Themes & Bar Chart */}
                    {analysis.topThemes.length > 0 && (
                      <div className="flex flex-col gap-3.5 p-4 sm:p-5 rounded-2xl bg-[#FAF6EF] border border-[#D6C9B430]">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[13px] sm:text-[14px] font-black uppercase text-[#7A7060] tracking-wider">Top Conversation Themes</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.topThemes.slice(0, 4).map((t) => (
                              <span key={t.theme} className="text-[11px] font-bold text-[#8B5CA8] bg-[#F3EDF8] px-2.5 py-0.5 rounded-md capitalize border border-[#8B5CA820]">
                                #{t.theme}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ThemeBarChart themes={analysis.topThemes} />
                      </div>
                    )}

                    {/* Spoken Session Transcripts Breakdown */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-[#D6C9B430] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[20px]">💬</span>
                          <h4 className="text-[16px] sm:text-[17px] font-black text-[#2B2B2B]">Spoken Session Transcripts</h4>
                        </div>
                        <span className="text-[12px] font-bold text-[#2E6F6E] bg-[#EBF4F4] px-2.5 py-1 rounded-full">
                          {sessions.length} sessions recorded
                        </span>
                      </div>

                      {sessions.length === 0 ? (
                        <p className="text-[14px] text-[#7A7060] italic py-6 text-center">No spoken session transcripts recorded yet.</p>
                      ) : (
                        <div className="flex flex-col gap-3.5">
                          {sessions.map((sess) => (
                            <div key={sess.id} className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#D6C9B430] flex flex-col gap-3 shadow-xs">
                              <div className="flex items-center justify-between border-b border-[#D6C9B430] pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CA8]"></span>
                                  <span className="text-[14px] font-black text-[#2E6F6E]">Session #{sess.id}</span>
                                </div>
                                <span className="text-[12px] font-semibold text-[#7A7060]">
                                  {new Date(sess.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <div className="flex flex-col gap-2.5">
                                {sess.responses.map((resp, idx) => (
                                  <div key={resp.id} className="p-3 rounded-xl bg-white border border-[#D6C9B430] flex flex-col gap-1">
                                    <p className="text-[13px] font-bold text-[#2B2B2B] flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-md bg-[#F3EDF8] text-[#8B5CA8] font-black text-[11px]">Q{idx + 1}</span>
                                      <span>{resp.questionText || "Question"}</span>
                                    </p>
                                    <div className="mt-1 pl-3 py-1.5 border-l-3 border-[#8B5CA8] bg-[#F9F6FC] rounded-r-xl">
                                      <p className="text-[12px] font-bold text-[#8B5CA8] uppercase tracking-wider text-[10px] mb-0.5">Spoken Answer (Transcribed):</p>
                                      <p className="text-[13px] font-medium text-[#2B2B2B] italic">
                                        "{resp.transcript || "No answer spoken/transcribed"}"
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[14px] text-[#7A7060] italic py-8 text-center">No chit-chat analysis available yet.</p>
                )}
              </div>
            )}

            {/* DEDICATED SCREEN 3: RISK ALERTS */}
            {activeSection === "alerts" && (
              <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#D6C9B4] flex flex-col gap-4 sm:gap-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D6C9B430] pb-3.5 sm:pb-4 gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="text-[24px] sm:text-[28px]">🚨</span>
                    <div>
                      <h3 className="text-[18px] sm:text-[22px] font-black text-[#2B2B2B]">Risk Alerts & Behavioral Warnings</h3>
                      <p className="text-[12px] sm:text-[13px] font-bold text-[#7A7060]">Safety notifications generated from patient interactions</p>
                    </div>
                  </div>
                  <span className="text-[12px] sm:text-[14px] font-black text-[#C1613D] bg-[#FFF0EB] px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-[#C1613D30] self-start sm:self-auto">
                    {alerts.length} Active Alerts
                  </span>
                </div>

                {alerts.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center gap-2">
                    <span className="text-[40px]">🌿</span>
                    <p className="text-[16px] font-black text-[#2B2B2B]">All Clear!</p>
                    <p className="text-[14px] text-[#7A7060]">No behavioral risk alerts flagged for this patient.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {alerts.map((alt) => (
                      <AlertCard key={alt.id} alert={alt} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DEDICATED SCREEN 4: REMINDERS */}
            {activeSection === "reminders" && (
              <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#D6C9B4] flex flex-col gap-4 sm:gap-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D6C9B430] pb-3.5 sm:pb-4 gap-2.5">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="text-[24px] sm:text-[28px]">⏰</span>
                    <div>
                      <h3 className="text-[18px] sm:text-[22px] font-black text-[#2B2B2B]">Patient Reminders Management</h3>
                      <p className="text-[12px] sm:text-[13px] font-bold text-[#7A7060]">Schedule and manage medication, meals, and hydration alerts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddReminderModal(true)}
                    className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-[#2E6F6E] text-white text-[13px] sm:text-[14px] font-black shadow-md hover:bg-[#255a59] transition-all self-start sm:self-auto"
                  >
                    + Add New Reminder
                  </button>
                </div>

                {patientReminders.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center gap-2">
                    <span className="text-[40px]">⏰</span>
                    <p className="text-[16px] font-black text-[#2B2B2B]">No Reminders Scheduled</p>
                    <p className="text-[14px] text-[#7A7060]">Click the button above to add a reminder for your patient.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {patientReminders.map((r) => (
                      <div key={r.id} className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#FAF6EF] border border-[#D6C9B430] shadow-xs gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FFF9EB] text-[#D9A441] text-[18px] sm:text-[22px] flex items-center justify-center font-bold flex-shrink-0">
                            ⏰
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[15px] sm:text-[16px] font-black text-[#2B2B2B]">{r.title}</p>
                              <ReminderFrequencyTag frequency={r.frequency} days={r.days} />
                            </div>
                            <p className="text-[12px] sm:text-[13px] font-semibold text-[#7A7060] mt-0.5">
                              Time: {r.time} · Category: <span className="capitalize">{r.category}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between min-[480px]:justify-end gap-3 pt-2 min-[480px]:pt-0 border-t min-[480px]:border-t-0 border-[#D6C9B430]">
                          <span className={`text-[11px] sm:text-[12px] font-black px-2.5 py-1 rounded-xl ${r.isCompleted ? "bg-[#EEF4EE] text-[#7A9B76] border border-[#7A706030]" : "bg-[#FFF0EB] text-[#C1613D] border border-[#C1613D30]"}`}>
                            {r.isCompleted ? "Completed ✓" : "Pending"}
                          </span>
                          <button
                            onClick={() => setDeletingReminderId(r.id)}
                            className="p-2 sm:p-2.5 rounded-xl flex items-center justify-center text-[#C1613D] hover:bg-[#FFF0EB] border border-[#C1613D30] transition-all"
                            title="Delete Reminder"
                          >
                            <IconTrash size={16} color="#C1613D" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <BambooStrip />
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────────────────────

type Screen = "auth" | "onboarding" | "home" | "games" | "game" | "mindsnap" | "smrititaal" | "sanga" | "reminders" | "smriti" | "chitchat" | "profile" | "caregiver-dashboard";

const PATIENT_NAV: { screen: Screen; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    screen: "home",
    label: "Home",
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? "#2E6F6E" : "#A09080"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    screen: "games",
    label: "Play",
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? "#2E6F6E" : "#A09080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.5 11h-1a1 1 0 0 1-1-1V8a1 1 0 0 0-1-1h-2a1 1 0 0 1-1-1V5a2.5 2.5 0 0 0-5 0v1a1 1 0 0 1-1 1H6a1 1 0 0 0-1 1v2a1 1 0 0 1-1 1H3a2.5 2.5 0 0 0 0 5h1a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 1 1 1v1a2.5 2.5 0 0 0 5 0v-1a1 1 0 0 1 1-1h2a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1h1a2.5 2.5 0 0 0 0-5z" />
      </svg>
    ),
  },
  {
    screen: "reminders",
    label: "Reminders",
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a ? "#2E6F6E" : "#A09080"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [lang, setLang] = useState<Lang>("en");
  const [user, setUserState] = useState<UserProfile>({
    name:             localStorage.getItem("smriti_user_name")  ?? "",
    email:            localStorage.getItem("smriti_user_email") ?? "",
    phone:            localStorage.getItem("smriti_user_phone") ?? "",
    age:              localStorage.getItem("smriti_user_age")   ?? "",
    careCode:         localStorage.getItem("smriti_user_care_code") ?? "",
    emergencyContact: localStorage.getItem("smriti_user_emergency") ?? "",
    avatar:           localStorage.getItem("smriti_user_avatar") ?? "avatar-1",
  });

  const saveUserProfile = (u: UserProfile | ((prev: UserProfile) => UserProfile)) => {
    setUserState((prev) => {
      const next = typeof u === "function" ? u(prev) : u;
      const cleanName = typeof next.name === "string" ? next.name : prev.name || "";
      if (cleanName) localStorage.setItem("smriti_user_name", cleanName);
      if (typeof next.email === "string" && next.email) localStorage.setItem("smriti_user_email", next.email);
      if (typeof next.phone === "string" && next.phone) localStorage.setItem("smriti_user_phone", next.phone);
      if (typeof next.age === "string" && next.age) localStorage.setItem("smriti_user_age", next.age);
      if (typeof next.careCode === "string" && next.careCode) localStorage.setItem("smriti_user_care_code", next.careCode);
      if (typeof next.emergencyContact === "string" && next.emergencyContact) localStorage.setItem("smriti_user_emergency", next.emergencyContact);
      if (typeof next.avatar === "string" && next.avatar) localStorage.setItem("smriti_user_avatar", next.avatar);
      return { ...next, name: cleanName };
    });
  };

  useEffect(() => {
    const token = api.getAccessToken();
    const role = api.getStoredRole();
    if (token && role) {
      initSocketConnection();
      if (role === "caregiver") {
        setScreen("caregiver-dashboard");
      } else {
        setScreen("home");
        api.fetchPatientProfile()
          .then((p) => {
            saveUserProfile({
              id: p.id,
              name: p.name,
              email: p.email || "",
              phone: p.phone,
              age: String(p.age || ""),
              language: p.language,
              careCode: p.careCode,
              emergencyContact: p.emergencyContact || "",
              avatar: p.avatar || "avatar-1",
            });
          })
          .catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    if (screen !== "auth") {
      initSocketConnection();
    }
  }, [screen]);

  function handleLogout() {
    disconnectSocket();
    api.clearTokens();
    localStorage.removeItem("smriti_user_name");
    localStorage.removeItem("smriti_user_email");
    localStorage.removeItem("smriti_user_phone");
    localStorage.removeItem("smriti_user_age");
    localStorage.removeItem("smriti_user_care_code");
    localStorage.removeItem("smriti_user_emergency");
    localStorage.removeItem("smriti_user_avatar");
    setUserState({ name: "", email: "", phone: "", age: "" });
    setScreen("auth");
  }

  const NAV_LABELS: Record<string, string> = {
    home:      TRANSLATIONS.navHome[lang],
    games:     TRANSLATIONS.navPlay[lang],
    reminders: TRANSLATIONS.navReminders[lang],
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
    <UserContext.Provider value={{ user, setUser: saveUserProfile }}>
      <div className="size-full flex flex-col bg-[#F5EFE4]">
        {/* Full-screen flows */}
        {screen === "auth" && (
          <LoginRegisterScreen
            onDone={(role, profile) => {
              if (typeof profile === "object" && profile !== null) {
                saveUserProfile(profile);
              }
              setScreen(role === "caregiver" ? "caregiver-dashboard" : "onboarding");
            }}
          />
        )}
        {screen === "onboarding" && <OnboardingScreen onContinue={() => setScreen("home")} />}
        {screen === "caregiver-dashboard" && <CaregiverDashboard onLogout={handleLogout} />}

        {/* Patient app with bottom nav */}
        {!["auth", "onboarding", "caregiver-dashboard"].includes(screen) && (
          <>
            <div className="flex-1 overflow-y-auto">
              {screen === "home" && <HomeScreen onNavigate={setScreen} onSettings={() => {}} />}
              {screen === "games" && <GamesScreen onNavigate={setScreen} onBack={() => setScreen("home")} />}
              {screen === "game" && <MemoryGameScreen onBack={() => setScreen("games")} />}
              {screen === "mindsnap" && <MindsnapScreen onBack={() => setScreen("games")} />}
              {screen === "smrititaal" && <SmritiTaalScreen onBack={() => setScreen("games")} />}
              {screen === "sanga" && <SangaGameScreen onBack={() => setScreen("games")} />}
              {screen === "reminders" && <RemindersScreen onBack={() => setScreen("home")} />}
              {screen === "smriti" && <SmritiScreen onBack={() => setScreen("home")} />}
              {screen === "chitchat" && <ChitChatScreen onBack={() => setScreen("home")} />}
              {screen === "profile" && <ProfileScreen onBack={() => setScreen("home")} onLogout={handleLogout} />}
            </div>

            <nav className="flex-shrink-0 flex items-center justify-around px-4 py-1 border-t shadow-xs" style={{ backgroundColor: "#F5EFE4", borderColor: "#D6C9B4" }}>
              {PATIENT_NAV.map((tab) => (
                <button
                  key={tab.screen}
                  onClick={() => setScreen(tab.screen)}
                  className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200"
                  style={{ backgroundColor: screen === tab.screen ? "#E4F0F0" : "transparent" }}
                >
                  {tab.icon(screen === tab.screen)}
                  <span className="text-[11px] font-bold leading-tight" style={{ color: screen === tab.screen ? "#2E6F6E" : "#A09080" }}>
                    {NAV_LABELS[tab.screen] ?? tab.label}
                  </span>
                </button>
              ))}
            </nav>
          </>
        )}
      </div>
    </UserContext.Provider>
    </LangContext.Provider>
  );
}
