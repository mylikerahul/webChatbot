// Response type definitions
type ResponseFunction = (message: string) => string;
type RawResponse = string | string[] | ResponseFunction;

// Query rule interface
interface QueryRule {
  pattern: RegExp;
  response: RawResponse;
}

// Pattern registry for common queries
class PatternRegistry {
  static readonly GREETING =
    /^(hi+|hello+|hey+|helo|hii+|hyy|heyy+|namaste|namaskar|pranam|salaam|salam|sup|yo|good\s*(morning|evening|afternoon|night))\s*[!.?]?\s*$/i;

  // ✅ FIX: All word orders covered — "kaise hai tu", "tu kaisa hai", "kaisa hai", etc.
  static readonly HOW_ARE_YOU =
    /how\s+are\s+you|kaisa\s+hai|kya\s+haal|aap\s+kaise|kaisi\s+ho|kaise\s+hain|tu\s+kaisa|tum\s+kaise|kaise\s+ho|kaise\s+hai\s+tu|tu\s+kaisa\s+hai|kya\s+haal\s+hai|sab\s+theek|theek\s+ho|kaisa\s+chal|kya\s+chal\s+raha|sab\s+badhiya/i;

  static readonly WHO_ARE_YOU =
    /tum\s+kaun|aap\s+kaun|who\s+are\s+you|what\s+are\s+you|kya\s+ho\s+tum|are\s+you\s+(a\s+)?(bot|ai|robot)/i;

  static readonly THANKS =
    /^(thanks|thank\s*you|shukriya|dhanyawad|dhanyavaad|thx|ty|thanku|thnks|bahut\s+accha|bahut\s+acha|acha\s+hai)\s*[!.]?\s*$/i;

  static readonly GOODBYE =
    /^(bye+|goodbye|alvida|ok\s*bye|cya|tata|baad\s+mein|baad\s+me|nikal|chalo|see\s+you|phir\s+milenge)\s*[!.]?\s*$/i;

  static readonly HELP =
    /^(help|madad|sahayata|guide|\?+|kya\s+kar\s+sakte|kya\s+karta\s+hai|kaise\s+use\s+karein)/i;

  static readonly YES_NO =
    /^\s*(yes|no|haan|nahi|nope|yep|okay|ok|theek\s+hai|bilkul)\s*[!.]?\s*$/i;

  static readonly JOKE =
    /\b(joke|funny|hasao|comedy|hans|mazak)\b/i;

  static readonly WEATHER =
    /\b(weather|mausam|barish|garmi|sardi|temp|temperature)\b/i;

  static readonly TIME =
    /\b(time|date|kitne\s+baje|kya\s+time|aaj\s+ka\s+din)\b/i;

  // ✅ NEW: Catch random chit-chat that shouldn't trigger product search
  static readonly CHIT_CHAT =
    /^(kya\s+kar\s+rahe|kya\s+chal|kuch\s+nahi|bore\s+ho|pagal\s+ho|bakwaas|chup\s+kar|shut\s+up|tu\s+kya\s+hai|acha\s+theek|hmmm*|hmm|ohh*|ohk|hehe|haha|lol|lmao|xd)\s*[!.?]?\s*$/i;
}

// Response pool for various query types
class ResponsePool {
  static readonly GREETING: string[] = [
    'Namaste! Main aapki shopping assistant hoon. Kya chahiye aapko?',
    'Hello! Batao kya dhundh rahe ho? Main help ke liye ready hoon.',
    'Hey! Main yahan hoon help ke liye. Koi product chahiye?',
    'Hi there! Aaj kya shopping karni hai? Batao!',
  ];

  static readonly HOW_ARE_YOU: string[] = [
    'Main bilkul mast hoon! Aap batao, aaj kya shopping karni hai? 😊',
    'Ekdum badhiya! Aapke liye koi product dhundhu? 🛍️',
    'Theek hoon, shukriya poochne ke liye! Koi product chahiye aapko?',
  ];

  static readonly THANKS: string[] = [
    'Aapka swagat hai! Kuch aur chahiye toh zaroor poochein.',
    'Khushi hui help karke! Aur koi product dhundna ho toh bolo.',
    'No problem! Apna khayal rakhna. Koi aur query ho toh ready hoon.',
  ];

  static readonly GOODBYE: string[] = [
    'Alvida! Vapas aana jab bhi shopping karni ho!',
    'Bye bye! Take care. Kuch bhi chahiye toh bata dena.',
    'See you! Happy shopping!',
  ];

  static readonly HELP: string[] = [
    [
      'Main aapki personal shopping assistant hoon.\n',
      'Aap ye kar sakte hain:',
      '"Laptop under 50000 dikhao"',
      '"Best headphones"',
      '"Kitchen appliances budget mein"',
      '"Sasta phone chahiye"',
      '"boAt Airdopes ki details"\n',
      'Bas product naam ya budget batao, main dhundh laungi!',
    ].join('\n'),
  ];

  static readonly CHIT_CHAT: string[] = [
    'Haha! Main toh shopping ke liye hoon. Koi product chahiye? 😄',
    'Acha acha! Ab batao kya dhundh rahe ho? 🛍️',
    'Interesting! Chaliye kuch shopping karte hain — kya chahiye?',
  ];
}

// Service for resolving responses
class ResponseResolverService {
  resolve(response: RawResponse, message: string): string {
    if (typeof response === 'function') return response(message);
    if (Array.isArray(response)) return this.pickRandom(response);
    return response;
  }

  private pickRandom(pool: string[]): string {
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

// Rule engine for matching queries
class RuleEngine {
  private readonly rules: QueryRule[];

  constructor() {
    this.rules = this.initializeRules();
  }

  match(query: string): QueryRule | null {
    for (const rule of this.rules) {
      if (rule.pattern.test(query)) return rule;
    }
    return null;
  }

  private initializeRules(): QueryRule[] {
    return [
      { pattern: PatternRegistry.GREETING,    response: ResponsePool.GREETING },
      { pattern: PatternRegistry.HOW_ARE_YOU, response: ResponsePool.HOW_ARE_YOU },
      { pattern: PatternRegistry.WHO_ARE_YOU, response: 'Main ek AI shopping assistant hoon! Mera kaam hai aapko best products dhundne mein help karna. Kya chaiye aapko?' },
      { pattern: PatternRegistry.THANKS,      response: ResponsePool.THANKS },
      { pattern: PatternRegistry.GOODBYE,     response: ResponsePool.GOODBYE },
      { pattern: PatternRegistry.HELP,        response: ResponsePool.HELP },
      { pattern: PatternRegistry.YES_NO,      response: 'Acha! Koi specific product ya category batao - main dhundh deta hoon.' },
      { pattern: PatternRegistry.JOKE,        response: 'Haha! Main toh shopping assistant hoon, comedian nahi — lekin ek accha deal dhundh ke zaroor hasaaunga! Kya chahiye?' },
      { pattern: PatternRegistry.WEATHER,     response: 'Weather main nahi jaanta, lekin agar garmi lag rahi hai toh ek accha cooler ya fan dhundh deta hoon! Kya chahiye?' },
      { pattern: PatternRegistry.TIME,        response: this.getTimeResponse },
      { pattern: PatternRegistry.CHIT_CHAT,   response: ResponsePool.CHIT_CHAT },
    ];
  }

  private getTimeResponse(_message: string): string {
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });
    return `Abhi ka time: ${currentTime} IST. Koi product dhundna hai?`;
  }
}

// Main handler class
export class CommonQueryHandler {
  private readonly ruleEngine: RuleEngine;
  private readonly resolverService: ResponseResolverService;

  constructor() {
    this.ruleEngine = new RuleEngine();
    this.resolverService = new ResponseResolverService();
  }

  handle(query: unknown): string | null {
    if (typeof query !== 'string') return null;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return null;

    const matchedRule = this.ruleEngine.match(trimmedQuery);
    if (!matchedRule) return null;

    return this.resolverService.resolve(matchedRule.response, trimmedQuery);
  }
}

// Singleton instance
const commonQueryHandlerInstance = new CommonQueryHandler();

export function handleCommonQuery(message: unknown): string | null {
  return commonQueryHandlerInstance.handle(message);
}