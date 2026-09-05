// ── Chit-Chat Question Bank ───────────────────────────────────────────────
// 10 questions in English, Assamese, and Manipuri (Meitei).
// Audio filenames map to files in src/Questions in all three language/<lang>/

export interface QuestionEntry {
  id: number;
  text: { en: string; as: string; mn: string };
  audioFile: { en: string; as: string; mn: string };
}

export const QUESTION_BANK: QuestionEntry[] = [
  {
    id: 1,
    text: {
      en: "How much water did you drink today?",
      as: "আজি আপুনি কিমান পানী খালে?",
      mn: "ꯉꯁꯤ ꯑꯗꯣꯝꯅꯥ ꯏꯁꯤꯡ ꯀꯌꯥ ꯊꯀꯈꯤꯕꯒꯦ?",
    },
    audioFile: {
      en: "1 how much water did you drink today.mp3",
      as: "1 আজি আপুনি কিমান পানী খালে.mp3",
      mn: "1 ꯉꯁꯤ ꯑꯗꯣꯝꯅꯥ ꯏꯁꯤꯡ ꯀꯌꯥ ꯊꯀꯈꯤꯕꯒꯦ.mp3",
    },
  },
  {
    id: 2,
    text: {
      en: "Who visited you or talked to you today?",
      as: "আজি কোনে আপোনাৰ ওচৰলৈ গৈছিল বা কথা পাতিছিল?",
      mn: "ꯉꯁꯤ ꯑꯗꯣꯃꯗꯥ ꯀꯅꯥꯅꯥ ꯂꯥꯀꯈꯤꯕꯒꯦ ꯅꯠꯔꯒꯥ ꯑꯗꯣꯃꯒꯥ ꯋꯥꯔꯤ ꯁꯥꯅꯈꯤꯕꯒꯦ?",
    },
    audioFile: {
      en: "2. Who visited you or talked to you today.mp3",
      as: "2. আজি কোনে আপোনাৰ ওচৰলৈ গৈছিল বা কথা পাতিছিল.mp3",
      mn: "2 ꯉꯁꯤ ꯑꯗꯣꯃꯗꯥ ꯀꯅꯥꯅꯥ ꯂꯥꯀꯈꯤꯕꯒꯦ ꯅꯠꯔꯒꯥ ꯑꯗꯣꯃꯒꯥ ꯋꯥꯔꯤ ꯁꯥꯅꯈꯤꯕꯒꯦ꯫.mp3",
    },
  },
  {
    id: 3,
    text: {
      en: "What colour are your clothes?",
      as: "তোমাৰ কাপোৰবোৰ কি ৰঙৰ?",
      mn: "ꯅꯉꯒꯤ ꯄꯣꯠꯆꯩꯁꯤꯡ ꯑꯁꯤ ꯀꯔꯤ ꯃꯆꯨꯒꯤꯅꯣ?",
    },
    audioFile: {
      en: "3. What colour are your clothes.mp3",
      as: "3. তোমাৰ কাপোৰবোৰ কি ৰঙৰ.mp3",
      mn: "3. ꯅꯉꯒꯤ ꯄꯣꯠꯆꯩꯁꯤꯡ ꯑꯁꯤ ꯀꯔꯤ ꯃꯆꯨꯒꯤꯅꯣ꯫.mp3",
    },
  },
  {
    id: 4,
    text: {
      en: "What did you spend most of your time doing today?",
      as: "আজি আপুনি কি কামত বেছি সময় কটালে?",
      mn: "ꯉꯁꯤ ꯑꯗꯣꯝꯅꯥ ꯑꯗꯣꯃꯒꯤ ꯃꯇꯝ ꯈ꯭ꯕꯥꯏꯗꯒꯤ ꯌꯥꯝꯅꯥ ꯀꯔꯤ ꯇꯧꯈꯤꯕꯒꯦ?",
    },
    audioFile: {
      en: "4. What did you spend most your time doing today.mp3",
      as: "4. আজি আপুনি কি কামত বেছি সময় কটালে.mp3",
      mn: "4. ꯉꯁꯤ ꯑꯗꯣꯝꯅꯥ ꯑꯗꯣꯃꯒꯤ ꯃꯇꯝ ꯈ꯭ꯕꯥꯏꯗꯒꯤ ꯌꯥꯝꯅꯥ ꯀꯔꯤ ꯇꯧꯈꯤꯕꯒꯦ꯫.mp3",
    },
  },
  {
    id: 5,
    text: {
      en: "What food did you like today?",
      as: "আজি কি খাদ্য ভাল লাগিল?",
      mn: "ꯉꯁꯤ ꯑꯗꯣꯝꯅꯥ ꯀꯔꯤ ꯆꯤꯟꯖꯥꯛ ꯄꯥꯝꯂꯤꯕꯒꯦ?",
    },
    audioFile: {
      en: "5. what food did you like today.mp3",
      as: "5. আজি কি খাদ্য ভাল লাগিল.mp3",
      mn: "5. ꯉꯁꯤ ꯑꯗꯣꯝꯅꯥ ꯀꯔꯤ ꯆꯤꯟꯖꯥꯛ ꯄꯥꯝꯂꯤꯕꯒꯦ꯫.mp3",
    },
  },
  {
    id: 6,
    text: {
      en: "Where did you keep something important today?",
      as: "আজি ক'ত কিবা এটা গুৰুত্বপূৰ্ণ বস্তু ৰাখিছিলা?",
      mn: "ꯉꯁꯤ ꯑꯗꯣꯝꯅꯥ ꯃꯔꯨꯑꯣꯏꯕꯥ ꯋꯥꯐꯝ ꯑꯃꯥ ꯀꯗꯥꯏꯗꯥ ꯊꯃꯈꯤꯕꯒꯦ?",
    },
    audioFile: {
      en: "6. Where did you keep something important today.mp3",
      as: "6. আজি ক_ত কিবা এটা গুৰুত্বপূৰ্ণ বস্তু ৰাখিছিলা.mp3",
      mn: "6. ꯉꯁꯤ ꯑꯗꯣꯝꯅꯥ ꯃꯔꯨꯑꯣꯏꯕꯥ ꯋꯥꯐꯝ ꯑꯃꯥ ꯀꯗꯥꯏꯗꯥ ꯊꯃꯈꯤꯕꯒꯦ꯫.mp3",
    },
  },
  {
    id: 7,
    text: {
      en: "What did you do just before this quiz?",
      as: "এই কুইজৰ ঠিক আগতে আপুনি কি কৰিছিল?",
      mn: "ꯀ꯭ꯕꯤꯖ ꯑꯁꯤꯒꯤ ꯃꯃꯥꯡꯗꯥ ꯑꯗꯣꯝꯅꯥ ꯀꯔꯤ ꯇꯧꯈꯤꯕꯒꯦ?",
    },
    audioFile: {
      en: "7. What did you do just before this quiz.mp3",
      as: "7. এই কুইজৰ ঠিক আগতে আপুনি কি কৰিছিল.mp3",
      mn: "7. ꯀ꯭ꯕꯤꯖ ꯑꯁꯤꯒꯤ ꯃꯃꯥꯡꯗꯥ ꯑꯗꯣꯝꯅꯥ ꯀꯔꯤ ꯇꯧꯈꯤꯕꯒꯦ꯫.mp3",
    },
  },
  {
    id: 8,
    text: {
      en: "What was your favourite thing today?",
      as: "আজি তোমাৰ প্ৰিয় বস্তুটো কি আছি?",
      mn: "ꯉꯁꯤ ꯑꯗꯣꯃꯒꯤ ꯈ꯭ꯕꯥꯏꯗꯒꯤ ꯄꯥꯝꯅꯕꯥ ꯋꯥꯐꯝ ꯑꯗꯨ ꯀꯔꯤꯅꯣ?",
    },
    audioFile: {
      en: "8. What was your favourite thing today.mp3",
      as: "8. আজি তোমাৰ প্ৰিয় বস্তুটো কি আছি.mp3",
      mn: "8. ꯉꯁꯤ ꯑꯗꯣꯃꯒꯤ ꯈ꯭ꯕꯥꯏꯗꯒꯤ ꯄꯥꯝꯅꯕꯥ ꯋꯥꯐꯝ ꯑꯗꯨ ꯀꯔꯤꯅꯣ.mp3",
    },
  },
  {
    id: 9,
    text: {
      en: "What was your favourite thing to do today?",
      as: "আজি তোমাৰ প্ৰিয় কামটো কি কৰিলে?",
      mn: "ꯉꯁꯤ ꯑꯗꯣꯃꯒꯤ ꯅꯨꯡꯁꯤꯖꯔꯕꯥ ꯊꯕꯛ ꯑꯗꯨ ꯀꯔꯤ ꯇꯧꯈꯤꯕꯒꯦ?",
    },
    audioFile: {
      en: "9. What did your favourite thing today.mp3",
      as: "9. আজি তোমাৰ প্ৰিয় কামটো কি কৰিলে.mp3",
      mn: "9. ꯉꯁꯤ ꯑꯗꯣꯃꯒꯤ ꯅꯨꯡꯁꯤꯖꯔꯕꯥ ꯊꯕꯛ ꯑꯗꯨ ꯀꯔꯤ ꯇꯧꯈꯤꯕꯒꯦ꯫.mp3",
    },
  },
  {
    id: 10,
    text: {
      en: "Did you see anything that made you happy today?",
      as: "আজি তোমাক সুখী কৰা কিবা এটা দেখিলা নেকি?",
      mn: "ꯉꯁꯤ ꯑꯗꯣꯃꯕꯨ ꯅꯨꯡꯉꯥꯏꯍꯅꯕꯥ ꯉꯝꯕꯥ ꯀꯔꯤꯒꯨꯝꯕꯥ ꯑꯃꯠꯇꯥ ꯎꯕꯤꯔꯃꯒꯅꯤ?",
    },
    audioFile: {
      en: "10. Did you see anything that made you happy today.mp3",
      as: "10. আজি তোমাক সুখী কৰা কিবা এটা দেখিলা নেকি.mp3",
      mn: "10. ꯉꯁꯤ ꯑꯗꯣꯃꯕꯨ ꯅꯨꯡꯉꯥꯏꯍꯅꯕꯥ ꯉꯝꯕꯥ ꯀꯔꯤꯒꯨꯝꯕꯥ ꯑꯃꯠꯇꯥ ꯎꯕꯤꯔꯃꯒꯅꯤ ꯫.mp3",
    },
  },
];

/**
 * Randomly select `count` questions from the bank.
 */
export function pickRandomQuestions(count: number = 5): QuestionEntry[] {
  const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, QUESTION_BANK.length));
}
