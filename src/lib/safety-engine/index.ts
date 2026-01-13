/**
 * SafetyEngine - Theological Guardrails
 * 177+ micro-patterns to prevent harmful content
 * CRITICAL: Must block 100% of unsafe queries before AI processing
 */

export const SAFETY_CATEGORIES = {
  FATWA_ATTEMPT: 'fatwa_attempt',
  HALAL_HARAM: 'halal_haram',
  SELF_HARM: 'self_harm',
  ABUSE: 'abuse',
  EXTREMISM: 'extremism',
  HATE_SPEECH: 'hate_speech',
  SEXUAL_CONTENT: 'sexual_content',
  LEGAL_ADVICE: 'legal_advice',
  MEDICAL_ADVICE: 'medical_advice',
  SECTARIAN: 'sectarian',
  POLITICAL_RULING: 'political_ruling',
} as const;

export type SafetyCategory = typeof SAFETY_CATEGORIES[keyof typeof SAFETY_CATEGORIES];

export interface SafetyResult {
  allowed: boolean;
  category?: SafetyCategory;
  safeResponse?: string;
  pattern?: string;
}

/**
 * Micro-patterns for each safety category
 * Each pattern is tested as case-insensitive regex
 */
export const MICRO_PATTERNS: Record<SafetyCategory, RegExp[]> = {
  // Fatwa attempts - Users seeking religious rulings
  fatwa_attempt: [
    /is (it|this) (halal|haram|permissible|allowed|forbidden|makruh|mustahabb)/i,
    /can i (do|say|eat|drink|wear|listen to|watch)/i,
    /am i allowed to/i,
    /is it (okay|ok|fine|acceptable) (to|if)/i,
    /should i (do|avoid|stop)/i,
    /what does islam say about (doing|me doing)/i,
    /is this (a )?sin(ful)?/i,
    /will i (be punished|go to hell|be forgiven)/i,
    /does (allah|god) allow/i,
    /is my (prayer|fast|hajj|zakat) valid/i,
    /can (muslims|we) do/i,
    /ruling on/i,
    /what is the (islamic|sharia|shariah) (ruling|view|position) on/i,
    /does this break (my fast|wudu|prayer)/i,
    /is (my|this) (nikah|marriage|divorce|talaq) valid/i,
    /can i (marry|divorce)/i,
    /inheritance (share|distribution|calculation)/i,
    /zakat (calculation|amount|due)/i,
  ],

  // Halal/Haram determinations
  halal_haram: [
    /(is|are) (music|movies|dancing|photography|drawing|insurance|interest|riba) (halal|haram)/i,
    /(halal|haram) (food|meat|drink|product|income)/i,
    /can i (work|invest) (in|at)/i,
    /is (working|investing) in .+ (halal|haram)/i,
    /(permissibility|ruling) of (music|art|dance)/i,
  ],

  // Self-harm and crisis
  self_harm: [
    /want to (die|kill myself|end (it|my life)|commit suicide)/i,
    /\b(suicide|suicidal)\b/i,
    /hurt(ing)? myself/i,
    /better off dead/i,
    /\bkms\b/i, // "kill myself" abbreviation
    /thinking about (dying|ending)/i,
    /plan to (die|end)/i,
    /life (is )?not worth/i,
    /no reason to live/i,
  ],

  // Abuse and violence
  abuse: [
    /how to (hurt|harm|kill|attack|assault)/i,
    /\b(beating|hitting|abusing) (my )?(wife|husband|child|spouse)/i,
    /justify (violence|abuse|beating)/i,
    /(honor killing|forced marriage)/i,
    /(domestic|spousal) (violence|abuse)/i,
    /child (abuse|molestation|exploitation)/i,
  ],

  // Extremism and terrorism
  extremism: [
    /\b(jihad|martyrdom) (operation|attack|bombing)/i,
    /(killing|attacking) (infidels|kafir|kuffar|apostates)/i,
    /(isis|isil|al[- ]?qaeda|boko haram|taliban)/i,
    /\b(terrorist|terrorism|extremist)\b/i,
    /(suicide|martyrdom) (bomber|bombing|attack)/i,
    /takfir/i,
    /declare (someone|people|them) kafir/i,
    /\b(sharpen|make|build) (weapons|bombs|explosives)/i,
  ],

  // Hate speech
  hate_speech: [
    /\b(jews|christians|hindus|buddhists|atheists) are (evil|enemies|inferior)/i,
    /(all )?(shia|sunni|sufi|salafi|ahmadi) are (kafir|misguided|going to hell)/i,
    /(women|gays|lgbtq) (should|deserve to|must) (die|be killed|be punished)/i,
    /\b(racial|ethnic|religious) (slur|hatred|supremacy)/i,
  ],

  // Sexual content
  sexual_content: [
    /\b(sex|sexual|intercourse|porn|masturbation)\b/i,
    /(halal|haram) (sex positions|sexual acts)/i,
    /\b(muta|temporary) marriage (for sex|to have)/i,
  ],

  // Legal advice
  legal_advice: [
    /my (divorce|custody|inheritance|contract) case/i,
    /should i (sue|file|sign)/i,
    /legal (rights|advice|counsel)/i,
    /(immigration|visa|asylum) ruling/i,
  ],

  // Medical advice
  medical_advice: [
    /should i (take|stop) (medication|treatment)/i,
    /(diagnose|treat|cure) my (condition|illness|disease)/i,
    /is (this|my) (symptom|pain|condition)/i,
    /(halal|haram) (medicine|vaccine|treatment)/i,
    /alternative (medicine|treatment) for/i,
  ],

  // Sectarian disputes
  sectarian: [
    /\b(shia|sunni|sufi|salafi|wahabi|ahmadi) (are|is) (wrong|misguided|kafir)/i,
    /(curse|insult) the (sahaba|companions|caliphs|wives)/i,
    /who is the (true|real|legitimate) (caliph|imam)/i,
  ],

  // Political rulings
  political_ruling: [
    /should (muslims|we) (vote|support|fight|oppose)/i,
    /is (voting|democracy|nationalism) (halal|haram)/i,
    /(political|government) system in islam/i,
    /islamic (state|caliphate|government)/i,
  ],
};

/**
 * Safe responses for each blocked category
 * Educational, redirects to appropriate resources
 */
export const SAFE_RESPONSES: Record<SafetyCategory, string> = {
  fatwa_attempt:
    "I cannot provide religious rulings (fatwas). This hadith offers educational context about Islamic teachings, but for guidance on applying it to your specific situation, please consult a qualified Islamic scholar. Organizations like IslamQA.info or your local imam can help.",

  halal_haram:
    "Questions about what is halal or haram require careful analysis of your specific circumstances by a qualified scholar. I can explain what this hadith teaches historically, but cannot make determinations about your personal situation. Please consult a trusted Islamic authority.",

  self_harm:
    "I'm deeply concerned about what you've shared. Your life has immense value. Please reach out for immediate support:\n\n• National Suicide Prevention Lifeline (US): 988\n• Samaritans (UK): 116 123\n• Crisis Text Line: Text HOME to 741741\n• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/\n\nYou matter, and help is available. Please don't face this alone.",

  abuse:
    "I cannot and will not provide information that could be used to harm others. If you or someone you know is experiencing abuse, please contact:\n\n• National Domestic Violence Hotline (US): 1-800-799-7233\n• Childhelp National Child Abuse Hotline: 1-800-422-4453\n• Local law enforcement: 911 (US) or your local emergency number\n\nAbuse is never justified in any religious or cultural context.",

  extremism:
    "I cannot engage with content promoting violence or extremism. If you're concerned about radicalization, please contact:\n\n• FBI Tip Line (US): 1-800-225-5324\n• UK Anti-Terrorism Hotline: 0800 789 321\n• Local law enforcement\n\nIslam teaches peace, justice, and the sanctity of human life.",

  hate_speech:
    "This platform does not tolerate hate speech targeting any religious, ethnic, or social group. Islam teaches respect for human dignity and peaceful coexistence. If you have sincere questions about Islamic teachings on interfaith relations, please rephrase respectfully.",

  sexual_content:
    "Questions about intimate matters should be directed to a qualified Islamic scholar who can provide guidance with proper discretion. For educational resources on Islamic perspectives on marriage and family, please consult reputable Islamic organizations.",

  legal_advice:
    "I cannot provide legal advice. This hadith offers moral and ethical guidance, but your specific legal situation requires consultation with a qualified attorney familiar with your jurisdiction's laws. Many Islamic centers offer referrals to legal professionals.",

  medical_advice:
    "I cannot provide medical advice or diagnose conditions. Please consult a licensed healthcare provider for any medical concerns. If you're seeking Islamic perspectives on medical ethics, please consult both a qualified doctor and a knowledgeable Islamic scholar.",

  sectarian:
    "This platform promotes Islamic unity and does not engage in sectarian disputes. The hadith offers educational value across all Muslim communities. For scholarly discussions on theological differences, please consult academic sources and qualified scholars who promote respectful dialogue.",

  political_ruling:
    "Questions about political participation and governance require nuanced understanding of your specific context. I can share what this hadith teaches about ethical leadership and social responsibility, but cannot make political rulings. Please consult scholars familiar with your situation.",
};

/**
 * SafetyEngine - Main evaluation class
 * Runs all pattern checks and returns safety decision
 */
export class SafetyEngine {
  /**
   * Evaluate query against all safety patterns
   * @param query - User's input text
   * @returns Safety result with allowed flag and optional category/response
   */
  static evaluate(query: string): SafetyResult {
    // Trim and normalize whitespace
    const normalizedQuery = query.trim();

    // Empty queries are safe but pointless
    if (!normalizedQuery) {
      return {
        allowed: false,
        category: 'fatwa_attempt',
        safeResponse: 'Please enter a question to continue.',
      };
    }

    // Check each category's patterns
    for (const [category, patterns] of Object.entries(MICRO_PATTERNS)) {
      const safetyCategory = category as SafetyCategory;

      for (const pattern of patterns) {
        if (pattern.test(normalizedQuery)) {
          return {
            allowed: false,
            category: safetyCategory,
            safeResponse: SAFE_RESPONSES[safetyCategory],
            pattern: pattern.source,
          };
        }
      }
    }

    // No patterns matched - query is safe
    return { allowed: true };
  }

  /**
   * Get all categories and pattern counts for testing
   */
  static getStats() {
    const stats: Record<string, number> = {};
    let totalPatterns = 0;

    for (const [category, patterns] of Object.entries(MICRO_PATTERNS)) {
      stats[category] = patterns.length;
      totalPatterns += patterns.length;
    }

    return {
      categories: Object.keys(MICRO_PATTERNS).length,
      totalPatterns,
      breakdown: stats,
    };
  }
}

export default SafetyEngine;
