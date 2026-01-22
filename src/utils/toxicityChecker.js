import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Rate limiting and caching for Gemini API
const toxicityCache = new Map(); // Cache results to avoid repeated API calls
const lastGeminiCall = { time: 0, count: 0 }; // Track API calls for rate limiting
const GEMINI_RATE_LIMIT = 15; // Max 15 calls per minute (free tier limit)
const GEMINI_COOLDOWN = 60000; // 1 minute cooldown after quota error
let geminiQuotaExceeded = false;
let quotaExceededUntil = 0;

// Comprehensive hate words list (fallback if Gemini is unavailable)
const TOXIC_WORDS = [
  // Profanity
  'fuck', 'fucking', 'fucked', 'shit', 'damn', 'hell', 'ass', 'asshole', 'bastard', 'bitch',
  // Hate speech
  'hate', 'hated', 'hating', 'stupid', 'idiot', 'moron', 'retard', 'dumb', 'dumbass',
  // Discriminatory terms
  'nigger', 'nigga', 'chink', 'kike', 'spic', 'wetback', 'gook', 'raghead', 'towelhead',
  // Violence
  'kill', 'killing', 'murder', 'die', 'death', 'violence', 'attack', 'hurt', 'harm',
  // Harassment
  'harass', 'bully', 'threaten', 'abuse', 'insult', 'offend',
  // Negative intent
  'bad', 'worst', 'terrible', 'awful', 'horrible', 'disgusting', 'vile', 'nasty',
  // Slurs and derogatory terms
  'slut', 'whore', 'hoe', 'cunt', 'pussy', 'dick', 'cock', 'penis', 'vagina',
  // Additional offensive terms
  'faggot', 'fag', 'dyke', 'tranny', 'shemale', 'hermaphrodite',
  // Cyberbullying terms
  'loser', 'pathetic', 'worthless', 'useless', 'failure', 'reject',
  // Threatening language
  'threat', 'threaten', 'harm', 'hurt', 'destroy', 'ruin', 'wreck',
  // Body shaming
  'fat', 'ugly', 'disgusting', 'gross', 'hideous',
  // Mental health slurs
  'crazy', 'insane', 'psycho', 'lunatic', 'mental', 'retarded',
  // Additional profanity variations
  'fck', 'sh1t', 'd4mn', 'h3ll', '4ss', 'b1tch', 'n1gg3r',
  // Common misspellings/alternatives
  'fuk', 'shyt', 'dam', 'hel', 'as', 'bich', 'nigr', 'niga',
  
  // Minor insults and derogatory terms
  'jerk', 'fool', 'clown', 'buffoon', 'imbecile', 'dimwit', 'nincompoop', 'dunce',
  'twit', 'dolt', 'blockhead', 'numbskull', 'bonehead', 'airhead', 'dummy',
  'simpleton', 'halfwit', 'nitwit', 'dork', 'nerd', 'geek', 'weirdo', 'freak',
  'creep', 'weird', 'annoying', 'irritating', 'obnoxious', 'rude', 'mean',
  'selfish', 'arrogant', 'pompous', 'conceited', 'narcissist', 'egotistical',
  'lazy', 'slacker', 'slob', 'pig', 'animal', 'beast', 'monster', 'devil',
  'scum', 'trash', 'garbage', 'filth', 'dirt', 'worm', 'snake', 'rat',
  'coward', 'weakling', 'wimp', 'pushover', 'doormat', 'spineless',
  'liar', 'cheat', 'fraud', 'fake', 'phony', 'hypocrite', 'traitor',
  'snob', 'elitist', 'bigot', 'racist', 'sexist', 'homophobe',
  'idiot', 'moron', 'imbecile', 'retard', 'dumb', 'stupid', 'foolish',
  'ugly', 'hideous', 'repulsive', 'disgusting', 'gross', 'nasty',
  'annoying', 'irritating', 'bothersome', 'pesky', 'pest', 'nuisance',
  
  // Hindi toxic words (transliterated)
  'chutiya', 'chut', 'lund', 'gaand', 'gaandu', 'bhosdike', 'bhenchod', 'behenchod',
  'madarchod', 'maa ki chut', 'teri maa', 'randi', 'raand', 'kutiya', 'kutta',
  'harami', 'haramzada', 'sale', 'saale', 'chakke', 'hijra', 'napunsak',
  'bewakoof', 'pagal', 'paagal', 'chaman', 'chutiye', 'gadha', 'gadhe',
  'murkh', 'murkha', 'moorkh', 'bakwas', 'bakwaas', 'tatti', 'moot',
  'lauda', 'laude', 'lund', 'chut', 'gaand', 'gand', 'gandu',
  
  // Urdu toxic words (transliterated)
  'harami', 'haramzada', 'haramkhor', 'kutta', 'kutti', 'kutte', 'kuttiya',
  'randi', 'raand', 'rand', 'chutiya', 'chut', 'lund', 'lauda', 'laude',
  'gaand', 'gand', 'gaandu', 'gandu', 'bhenchod', 'behenchod', 'madarchod',
  'bhosdike', 'bhosdi', 'sale', 'saale', 'chakke', 'hijra', 'napunsak',
  'bewakoof', 'pagal', 'paagal', 'chaman', 'chutiye', 'gadha', 'gadhe',
  'murkh', 'murkha', 'moorkh', 'bakwas', 'bakwaas', 'tatti', 'moot',
  
  // Punjabi toxic words (transliterated) - Comprehensive list
  'chutiya', 'chut', 'choot', 'chootiya', 'chootiye', 'chutiye', 'chutia', 'chuti',
  'lund', 'laund', 'launda', 'launde', 'lauda', 'laude', 'laud', 'lauda',
  'gaand', 'gand', 'gaandu', 'gandu', 'gand', 'gaand', 'gandu', 'gaandu', 'gandiya',
  'bhenchod', 'behenchod', 'bhen chod', 'behen chod', 'bhenchod', 'behenchod', 'bhen ki chut',
  'madarchod', 'maa chod', 'maa ki chut', 'teri maa', 'teri maa ki', 'maa da', 'maa di',
  'bhosdike', 'bhosdi', 'bhosdi ke', 'bhosdi ke', 'bhosdike', 'bhosdi', 'bhosda', 'bhosde',
  'sale', 'saale', 'sale', 'saale', 'sale', 'saale', 'saala', 'saali',
  'randi', 'raand', 'rand', 'randi', 'raand', 'rand', 'randiye', 'randiya',
  'kutiya', 'kutta', 'kutte', 'kutti', 'kuttiya', 'kutta', 'kutte', 'kutteya',
  'harami', 'haramzada', 'haramkhor', 'harami', 'haramzada', 'haramkhor', 'haram di aulad',
  'chakke', 'hijra', 'napunsak', 'chakke', 'hijra', 'napunsak', 'chakka', 'chakka',
  'bewakoof', 'pagal', 'paagal', 'chaman', 'chutiye', 'gadha', 'gadhe', 'gadhi',
  'murkh', 'murkha', 'moorkh', 'bakwas', 'bakwaas', 'tatti', 'moot', 'mootna',
  'choda', 'chod', 'chod', 'choda', 'chode', 'chodi', 'choda', 'chodeya',
  'chud', 'chudna', 'chudai', 'chudachudi', 'chudwa', 'chudwa ke', 'chudwa diya',
  'teri', 'teri maa', 'teri behen', 'teri bahan', 'teri ammi', 'teri bhen',
  'sutte', 'sutteya', 'sutta', 'sutte', 'sutteya', 'sutta',
  'khoti', 'khotiya', 'khotiye', 'khoti', 'khotiya',
  'lun', 'lun te', 'lun di', 'lun da', 'lun de', 'lun nu',
  'chut', 'chut te', 'chut di', 'chut da', 'chut de', 'chut nu',
  'gaand', 'gaand te', 'gaand di', 'gaand da', 'gaand de', 'gaand nu',
  'fuddu', 'fuddi', 'fuddiya', 'fuddu', 'fuddi', 'fuddiya',
  'bhen di', 'bhen da', 'bhen de', 'bhen nu', 'bhen te',
  'maa di', 'maa da', 'maa de', 'maa nu', 'maa te',
  'kutta', 'kutte', 'kutti', 'kuttiya', 'kutteya', 'kutte di',
  'sale', 'saale', 'saali', 'saala', 'saale di', 'saale da',
  'randi', 'randiye', 'randiya', 'randi di', 'randi da',
  'chutiya', 'chutiye', 'chutia', 'chutiya di', 'chutiya da',
  'harami', 'haramzada', 'haramkhor', 'harami di', 'harami da',
  'bhosdike', 'bhosdi', 'bhosdi ke', 'bhosdi di', 'bhosdi da',
  'madarchod', 'madarchod di', 'madarchod da', 'madarchod de',
  'bhenchod', 'bhenchod di', 'bhenchod da', 'bhenchod de',
  'chakke', 'chakka', 'chakke di', 'chakke da', 'chakke de',
  'napunsak', 'napunsak di', 'napunsak da', 'napunsak de',
  'hijra', 'hijre', 'hijra di', 'hijra da', 'hijra de',
  'gadha', 'gadhe', 'gadhi', 'gadhe di', 'gadhe da',
  'bewakoof', 'bewakoof di', 'bewakoof da', 'bewakoof de',
  'pagal', 'paagal', 'pagal di', 'pagal da', 'pagal de',
  'chaman', 'chaman di', 'chaman da', 'chaman de',
  'murkh', 'murkha', 'moorkh', 'murkh di', 'murkh da',
  'bakwas', 'bakwaas', 'bakwas di', 'bakwas da',
  'tatti', 'tatti di', 'tatti da', 'tatti de',
  'moot', 'mootna', 'moot di', 'moot da',
  'choda', 'chode', 'chodi', 'choda di', 'choda da',
  'chud', 'chudna', 'chudai', 'chud di', 'chud da',
  'fuddu', 'fuddi', 'fuddiya', 'fuddu di', 'fuddu da',
  'khoti', 'khotiya', 'khotiye', 'khoti di', 'khoti da',
  'sutte', 'sutteya', 'sutta', 'sutte di', 'sutte da',
  'lun', 'lun te', 'lun di', 'lun da', 'lun de',
  'chut', 'chut te', 'chut di', 'chut da', 'chut de',
  'gaand', 'gaand te', 'gaand di', 'gaand da', 'gaand de',
  'bhen di', 'bhen da', 'bhen de', 'bhen nu',
  'maa di', 'maa da', 'maa de', 'maa nu',
  'teri maa', 'teri behen', 'teri bahan', 'teri ammi',
  'teri maa ki', 'teri behen ki', 'teri bahan ki',
  'teri maa da', 'teri behen da', 'teri bahan da',
  'teri maa di', 'teri behen di', 'teri bahan di',
  'maa ki chut', 'behen ki chut', 'bahan ki chut',
  'maa da lund', 'behen da lund', 'bahan da lund',
  'maa di gaand', 'behen di gaand', 'bahan di gaand',
  'maa chod', 'behen chod', 'bahan chod',
  'maa choda', 'behen choda', 'bahan choda',
  'maa chode', 'behen chode', 'bahan chode',
  'maa chodi', 'behen chodi', 'bahan chodi',
  'maa chodna', 'behen chodna', 'bahan chodna',
  'maa chud', 'behen chud', 'bahan chud',
  'maa chudna', 'behen chudna', 'bahan chudna',
  'maa chudai', 'behen chudai', 'bahan chudai',
  'maa da choda', 'behen da choda', 'bahan da choda',
  'maa di chut', 'behen di chut', 'bahan di chut',
  'maa di gaand', 'behen di gaand', 'bahan di gaand',
  'maa da lund', 'behen da lund', 'bahan da lund',
  'teri maa nu', 'teri behen nu', 'teri bahan nu',
  'teri maa te', 'teri behen te', 'teri bahan te',
  'teri maa de', 'teri behen de', 'teri bahan de',
  'teri maa di', 'teri behen di', 'teri bahan di',
  'teri maa da', 'teri behen da', 'teri bahan da',
  'chut mar', 'chut mar ke', 'chut mar di', 'chut mar da',
  'lund mar', 'lund mar ke', 'lund mar di', 'lund mar da',
  'gaand mar', 'gaand mar ke', 'gaand mar di', 'gaand mar da',
  'chut fad', 'chut fad ke', 'chut fad di', 'chut fad da',
  'lund fad', 'lund fad ke', 'lund fad di', 'lund fad da',
  'gaand fad', 'gaand fad ke', 'gaand fad di', 'gaand fad da',
  'chut chat', 'chut chat ke', 'chut chat di', 'chut chat da',
  'lund chat', 'lund chat ke', 'lund chat di', 'lund chat da',
  'gaand chat', 'gaand chat ke', 'gaand chat di', 'gaand chat da',
  'chut choos', 'chut choos ke', 'chut choos di', 'chut choos da',
  'lund choos', 'lund choos ke', 'lund choos di', 'lund choos da',
  'gaand choos', 'gaand choos ke', 'gaand choos di', 'gaand choos da',
  'chut kha', 'chut kha ke', 'chut kha di', 'chut kha da',
  'lund kha', 'lund kha ke', 'lund kha di', 'lund kha da',
  'gaand kha', 'gaand kha ke', 'gaand kha di', 'gaand kha da',
  'chut le', 'chut le ke', 'chut le di', 'chut le da',
  'lund le', 'lund le ke', 'lund le di', 'lund le da',
  'gaand le', 'gaand le ke', 'gaand le di', 'gaand le da',
  'chut de', 'chut de ke', 'chut de di', 'chut de da',
  'lund de', 'lund de ke', 'lund de di', 'lund de da',
  'gaand de', 'gaand de ke', 'gaand de di', 'gaand de da',
  'chut la', 'chut la ke', 'chut la di', 'chut la da',
  'lund la', 'lund la ke', 'lund la di', 'lund la da',
  'gaand la', 'gaand la ke', 'gaand la di', 'gaand la da',
  'chut jha', 'chut jha ke', 'chut jha di', 'chut jha da',
  'lund jha', 'lund jha ke', 'lund jha di', 'lund jha da',
  'gaand jha', 'gaand jha ke', 'gaand jha di', 'gaand jha da',
  'chut maar', 'chut maar ke', 'chut maar di', 'chut maar da',
  'lund maar', 'lund maar ke', 'lund maar di', 'lund maar da',
  'gaand maar', 'gaand maar ke', 'gaand maar di', 'gaand maar da',
  'chut maar ke', 'lund maar ke', 'gaand maar ke',
  'chut maar di', 'lund maar di', 'gaand maar di',
  'chut maar da', 'lund maar da', 'gaand maar da',
  'chut maar de', 'lund maar de', 'gaand maar de',
  'chut maar nu', 'lund maar nu', 'gaand maar nu',
  'chut maar te', 'lund maar te', 'gaand maar te',
  'chut fad ke', 'lund fad ke', 'gaand fad ke',
  'chut fad di', 'lund fad di', 'gaand fad di',
  'chut fad da', 'lund fad da', 'gaand fad da',
  'chut fad de', 'lund fad de', 'gaand fad de',
  'chut fad nu', 'lund fad nu', 'gaand fad nu',
  'chut fad te', 'lund fad te', 'gaand fad te',
  'chut chat ke', 'lund chat ke', 'gaand chat ke',
  'chut chat di', 'lund chat di', 'gaand chat di',
  'chut chat da', 'lund chat da', 'gaand chat da',
  'chut chat de', 'lund chat de', 'gaand chat de',
  'chut chat nu', 'lund chat nu', 'gaand chat nu',
  'chut chat te', 'lund chat te', 'gaand chat te',
  'chut choos ke', 'lund choos ke', 'gaand choos ke',
  'chut choos di', 'lund choos di', 'gaand choos di',
  'chut choos da', 'lund choos da', 'gaand choos da',
  'chut choos de', 'lund choos de', 'gaand choos de',
  'chut choos nu', 'lund choos nu', 'gaand choos nu',
  'chut choos te', 'lund choos te', 'gaand choos te',
  'chut kha ke', 'lund kha ke', 'gaand kha ke',
  'chut kha di', 'lund kha di', 'gaand kha di',
  'chut kha da', 'lund kha da', 'gaand kha da',
  'chut kha de', 'lund kha de', 'gaand kha de',
  'chut kha nu', 'lund kha nu', 'gaand kha nu',
  'chut kha te', 'lund kha te', 'gaand kha te',
  'chut le ke', 'lund le ke', 'gaand le ke',
  'chut le di', 'lund le di', 'gaand le di',
  'chut le da', 'lund le da', 'gaand le da',
  'chut le de', 'lund le de', 'gaand le de',
  'chut le nu', 'lund le nu', 'gaand le nu',
  'chut le te', 'lund le te', 'gaand le te',
  'chut de ke', 'lund de ke', 'gaand de ke',
  'chut de di', 'lund de di', 'gaand de di',
  'chut de da', 'lund de da', 'gaand de da',
  'chut de de', 'lund de de', 'gaand de de',
  'chut de nu', 'lund de nu', 'gaand de nu',
  'chut de te', 'lund de te', 'gaand de te',
  'chut la ke', 'lund la ke', 'gaand la ke',
  'chut la di', 'lund la di', 'gaand la di',
  'chut la da', 'lund la da', 'gaand la da',
  'chut la de', 'lund la de', 'gaand la de',
  'chut la nu', 'lund la nu', 'gaand la nu',
  'chut la te', 'lund la te', 'gaand la te',
  'chut jha ke', 'lund jha ke', 'gaand jha ke',
  'chut jha di', 'lund jha di', 'gaand jha di',
  'chut jha da', 'lund jha da', 'gaand jha da',
  'chut jha de', 'lund jha de', 'gaand jha de',
  'chut jha nu', 'lund jha nu', 'gaand jha nu',
  'chut jha te', 'lund jha te', 'gaand jha te',
  
  // Additional Punjabi-specific abusive terms
  'kuthi', 'kuthiya', 'kuthiye', 'kuthi di', 'kuthi da', 'kuthi de',
  'khoti', 'khotiya', 'khotiye', 'khoti di', 'khoti da', 'khoti de',
  'sutte', 'sutteya', 'sutta', 'sutte di', 'sutte da', 'sutte de',
  'fuddu', 'fuddi', 'fuddiya', 'fuddu di', 'fuddu da', 'fuddu de',
  'lun', 'lun te', 'lun di', 'lun da', 'lun de', 'lun nu',
  'chut', 'chut te', 'chut di', 'chut da', 'chut de', 'chut nu',
  'gaand', 'gaand te', 'gaand di', 'gaand da', 'gaand de', 'gaand nu',
  'bhen di', 'bhen da', 'bhen de', 'bhen nu', 'bhen te',
  'maa di', 'maa da', 'maa de', 'maa nu', 'maa te',
  'teri maa', 'teri behen', 'teri bahan', 'teri ammi',
  'teri maa ki', 'teri behen ki', 'teri bahan ki',
  'teri maa da', 'teri behen da', 'teri bahan da',
  'teri maa di', 'teri behen di', 'teri bahan di',
  'maa ki chut', 'behen ki chut', 'bahan ki chut',
  'maa da lund', 'behen da lund', 'bahan da lund',
  'maa di gaand', 'behen di gaand', 'bahan di gaand',
  'maa chod', 'behen chod', 'bahan chod',
  'maa choda', 'behen choda', 'bahan choda',
  'maa chode', 'behen chode', 'bahan chode',
  'maa chodi', 'behen chodi', 'bahan chodi',
  'maa chodna', 'behen chodna', 'bahan chodna',
  'maa chud', 'behen chud', 'bahan chud',
  'maa chudna', 'behen chudna', 'bahan chudna',
  'maa chudai', 'behen chudai', 'bahan chudai',
  'maa da choda', 'behen da choda', 'bahan da choda',
  'maa di chut', 'behen di chut', 'bahan di chut',
  'maa di gaand', 'behen di gaand', 'bahan di gaand',
  'maa da lund', 'behen da lund', 'bahan da lund',
  'teri maa nu', 'teri behen nu', 'teri bahan nu',
  'teri maa te', 'teri behen te', 'teri bahan te',
  'teri maa de', 'teri behen de', 'teri bahan de',
  'teri maa di', 'teri behen di', 'teri bahan di',
  'teri maa da', 'teri behen da', 'teri bahan da',
  'chut mar', 'chut mar ke', 'chut mar di', 'chut mar da',
  'lund mar', 'lund mar ke', 'lund mar di', 'lund mar da',
  'gaand mar', 'gaand mar ke', 'gaand mar di', 'gaand mar da',
  'chut fad', 'chut fad ke', 'chut fad di', 'chut fad da',
  'lund fad', 'lund fad ke', 'lund fad di', 'lund fad da',
  'gaand fad', 'gaand fad ke', 'gaand fad di', 'gaand fad da',
  'chut chat', 'chut chat ke', 'chut chat di', 'chut chat da',
  'lund chat', 'lund chat ke', 'lund chat di', 'lund chat da',
  'gaand chat', 'gaand chat ke', 'gaand chat di', 'gaand chat da',
  'chut choos', 'chut choos ke', 'chut choos di', 'chut choos da',
  'lund choos', 'lund choos ke', 'lund choos di', 'lund choos da',
  'gaand choos', 'gaand choos ke', 'gaand choos di', 'gaand choos da',
  'chut kha', 'chut kha ke', 'chut kha di', 'chut kha da',
  'lund kha', 'lund kha ke', 'lund kha di', 'lund kha da',
  'gaand kha', 'gaand kha ke', 'gaand kha di', 'gaand kha da',
  'chut le', 'chut le ke', 'chut le di', 'chut le da',
  'lund le', 'lund le ke', 'lund le di', 'lund le da',
  'gaand le', 'gaand le ke', 'gaand le di', 'gaand le da',
  'chut de', 'chut de ke', 'chut de di', 'chut de da',
  'lund de', 'lund de ke', 'lund de di', 'lund de da',
  'gaand de', 'gaand de ke', 'gaand de di', 'gaand de da',
  'chut la', 'chut la ke', 'chut la di', 'chut la da',
  'lund la', 'lund la ke', 'lund la di', 'lund la da',
  'gaand la', 'gaand la ke', 'gaand la di', 'gaand la da',
  'chut jha', 'chut jha ke', 'chut jha di', 'chut jha da',
  'lund jha', 'lund jha ke', 'lund jha di', 'lund jha da',
  'gaand jha', 'gaand jha ke', 'gaand jha di', 'gaand jha da',
  'chut maar', 'chut maar ke', 'chut maar di', 'chut maar da',
  'lund maar', 'lund maar ke', 'lund maar di', 'lund maar da',
  'gaand maar', 'gaand maar ke', 'gaand maar di', 'gaand maar da',
  'chut maar ke', 'lund maar ke', 'gaand maar ke',
  'chut maar di', 'lund maar di', 'gaand maar di',
  'chut maar da', 'lund maar da', 'gaand maar da',
  'chut maar de', 'lund maar de', 'gaand maar de',
  'chut maar nu', 'lund maar nu', 'gaand maar nu',
  'chut maar te', 'lund maar te', 'gaand maar te',
  'chut fad ke', 'lund fad ke', 'gaand fad ke',
  'chut fad di', 'lund fad di', 'gaand fad di',
  'chut fad da', 'lund fad da', 'gaand fad da',
  'chut fad de', 'lund fad de', 'gaand fad de',
  'chut fad nu', 'lund fad nu', 'gaand fad nu',
  'chut fad te', 'lund fad te', 'gaand fad te',
  'chut chat ke', 'lund chat ke', 'gaand chat ke',
  'chut chat di', 'lund chat di', 'gaand chat di',
  'chut chat da', 'lund chat da', 'gaand chat da',
  'chut chat de', 'lund chat de', 'gaand chat de',
  'chut chat nu', 'lund chat nu', 'gaand chat nu',
  'chut chat te', 'lund chat te', 'gaand chat te',
  'chut choos ke', 'lund choos ke', 'gaand choos ke',
  'chut choos di', 'lund choos di', 'gaand choos di',
  'chut choos da', 'lund choos da', 'gaand choos da',
  'chut choos de', 'lund choos de', 'gaand choos de',
  'chut choos nu', 'lund choos nu', 'gaand choos nu',
  'chut choos te', 'lund choos te', 'gaand choos te',
  'chut kha ke', 'lund kha ke', 'gaand kha ke',
  'chut kha di', 'lund kha di', 'gaand kha di',
  'chut kha da', 'lund kha da', 'gaand kha da',
  'chut kha de', 'lund kha de', 'gaand kha de',
  'chut kha nu', 'lund kha nu', 'gaand kha nu',
  'chut kha te', 'lund kha te', 'gaand kha te',
  'chut le ke', 'lund le ke', 'gaand le ke',
  'chut le di', 'lund le di', 'gaand le di',
  'chut le da', 'lund le da', 'gaand le da',
  'chut le de', 'lund le de', 'gaand le de',
  'chut le nu', 'lund le nu', 'gaand le nu',
  'chut le te', 'lund le te', 'gaand le te',
  'chut de ke', 'lund de ke', 'gaand de ke',
  'chut de di', 'lund de di', 'gaand de di',
  'chut de da', 'lund de da', 'gaand de da',
  'chut de de', 'lund de de', 'gaand de de',
  'chut de nu', 'lund de nu', 'gaand de nu',
  'chut de te', 'lund de te', 'gaand de te',
  'chut la ke', 'lund la ke', 'gaand la ke',
  'chut la di', 'lund la di', 'gaand la di',
  'chut la da', 'lund la da', 'gaand la da',
  'chut la de', 'lund la de', 'gaand la de',
  'chut la nu', 'lund la nu', 'gaand la nu',
  'chut la te', 'lund la te', 'gaand la te',
  'chut jha ke', 'lund jha ke', 'gaand jha ke',
  'chut jha di', 'lund jha di', 'gaand jha di',
  'chut jha da', 'lund jha da', 'gaand jha da',
  'chut jha de', 'lund jha de', 'gaand jha de',
  'chut jha nu', 'lund jha nu', 'gaand jha nu',
  'chut jha te', 'lund jha te', 'gaand jha te',
  
  // Bengali/Bangladeshi toxic words (transliterated)
  'choda', 'choda', 'chud', 'chudna', 'lund', 'lauda', 'laude', 'gaand',
  'gand', 'gaandu', 'gandu', 'bhenchod', 'behenchod', 'madarchod', 'bhosdike',
  'bhosdi', 'sale', 'saale', 'randi', 'raand', 'kutiya', 'kutta', 'kutte',
  'harami', 'haramzada', 'chakke', 'hijra', 'napunsak', 'bewakoof', 'pagal',
  'paagal', 'chaman', 'chutiye', 'gadha', 'gadhe', 'murkh', 'murkha', 'moorkh',
  'bakwas', 'bakwaas', 'tatti', 'moot', 'chuti', 'lund', 'gaand', 'choda',
  'chud', 'chudna', 'chudai', 'chudachudi',
  
  // Nepali toxic words (transliterated)
  'chutiya', 'chut', 'lund', 'lauda', 'laude', 'gaand', 'gand', 'gaandu',
  'gandu', 'bhenchod', 'behenchod', 'madarchod', 'bhosdike', 'bhosdi', 'sale',
  'saale', 'randi', 'raand', 'kutiya', 'kutta', 'kutte', 'harami', 'haramzada',
  'chakke', 'hijra', 'napunsak', 'bewakoof', 'pagal', 'paagal', 'chaman', 'chutiye',
  'gadha', 'gadhe', 'murkh', 'murkha', 'moorkh', 'bakwas', 'bakwaas', 'tatti',
  'moot', 'chuti', 'lund', 'gaand', 'choda', 'chud', 'chudna', 'chudai',
  
  // Persian/Farsi toxic words (transliterated)
  'kos', 'koss', 'koskesh', 'koskesh', 'kuni', 'kuni', 'konesh', 'konesh',
  'kos nanat', 'kos nanat', 'kos madaret', 'kos madaret', 'kos khar', 'kos khar',
  'khar', 'khar', 'ahmak', 'ahmak', 'ahmaq', 'ahmaq', 'nadan', 'nadan',
  'bi adab', 'bi adab', 'bi sharam', 'bi sharam', 'haramzade', 'haramzade',
  'haramzadeh', 'haramzadeh', 'koskesh', 'koskesh', 'kuni', 'kuni', 'konesh',
  'konesh', 'kos nanat', 'kos nanat', 'kos madaret', 'kos madaret', 'kos khar',
  'kos khar', 'khar', 'khar', 'ahmak', 'ahmak', 'ahmaq', 'ahmaq', 'nadan',
  'nadan', 'bi adab', 'bi adab', 'bi sharam', 'bi sharam', 'haramzade', 'haramzade',
  
  // Common transliterations and variations
  'chutia', 'chutiya', 'chutiye', 'chut', 'choot', 'chootiya', 'chootiye',
  'lund', 'laund', 'launda', 'launde', 'lauda', 'laude', 'lauda', 'laude',
  'gaand', 'gand', 'gaandu', 'gandu', 'gand', 'gaand', 'gandu', 'gaandu',
  'bhenchod', 'behenchod', 'bhen chod', 'behen chod', 'bhenchod', 'behenchod',
  'madarchod', 'maa chod', 'maa ki chut', 'teri maa', 'teri maa ki',
  'bhosdike', 'bhosdi', 'bhosdi ke', 'bhosdi ke', 'bhosdike', 'bhosdi',
  'sale', 'saale', 'sale', 'saale', 'sale', 'saale',
  'randi', 'raand', 'rand', 'randi', 'raand', 'rand',
  'kutiya', 'kutta', 'kutte', 'kutti', 'kuttiya', 'kutta', 'kutte',
  'harami', 'haramzada', 'haramkhor', 'harami', 'haramzada', 'haramkhor',
  'chakke', 'hijra', 'napunsak', 'chakke', 'hijra', 'napunsak',
  'bewakoof', 'pagal', 'paagal', 'chaman', 'chutiye', 'gadha', 'gadhe',
  'murkh', 'murkha', 'moorkh', 'bakwas', 'bakwaas', 'tatti', 'moot'
];

/**
 * Check if text contains toxic words (fallback method)
 */
export const checkToxicityFallback = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  const normalizedText = lowerText.replace(/[^a-z0-9\s]/g, ' '); // Remove special chars for better matching
  
  // Check for exact word matches and partial matches
  for (const word of TOXIC_WORDS) {
    // Check for word boundaries or as part of a word
    const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b|${word}`, 'i');
    if (wordRegex.test(normalizedText) || normalizedText.includes(word)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check toxicity using Gemini AI with rate limiting and caching
 */
export const checkToxicityWithGemini = async (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { isToxic: false, confidence: 0, reason: null };
  }

  // Check cache first
  const cacheKey = text.toLowerCase().trim();
  if (toxicityCache.has(cacheKey)) {
    return toxicityCache.get(cacheKey);
  }

  // AI-powered toxicity checking disabled - only Virtual Senior and RAG Engine are enabled
  // Use fallback word filter only
  console.log('AI toxicity checking disabled - using fallback word filter only');
  const result = { 
    isToxic: checkToxicityFallback(text), 
    confidence: 0.5, 
    reason: 'Fallback word filter (AI toxicity disabled)',
    method: 'fallback'
  };
  toxicityCache.set(cacheKey, result);
  return result;
  
  /* DISABLED: AI-powered toxicity checking
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === '') {
    console.warn('Gemini API key not configured, using fallback toxicity check');
    const result = { 
      isToxic: checkToxicityFallback(text), 
      confidence: 0.5, 
      reason: 'Fallback word filter',
      method: 'fallback'
    };
    toxicityCache.set(cacheKey, result);
    return result;
  }

  // Check if quota was exceeded recently
  const now = Date.now();
  if (geminiQuotaExceeded && now < quotaExceededUntil) {
    console.warn('Gemini quota exceeded, using fallback. Will retry after cooldown.');
    const result = {
      isToxic: checkToxicityFallback(text),
      confidence: 0.5,
      reason: 'Gemini quota exceeded, using fallback',
      method: 'fallback'
    };
    toxicityCache.set(cacheKey, result);
    return result;
  }

  // Rate limiting: Check if we've exceeded the limit
  if (now - lastGeminiCall.time < 60000) { // Within 1 minute
    if (lastGeminiCall.count >= GEMINI_RATE_LIMIT) {
      console.warn('Gemini rate limit reached, using fallback');
      const result = {
        isToxic: checkToxicityFallback(text),
        confidence: 0.5,
        reason: 'Rate limit reached, using fallback',
        method: 'fallback'
      };
      toxicityCache.set(cacheKey, result);
      return result;
    }
  } else {
    // Reset counter after 1 minute
    lastGeminiCall.time = now;
    lastGeminiCall.count = 0;
  }

  /* DISABLED: AI-powered toxicity checking - code below is disabled
  try {
    lastGeminiCall.count++;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const prompt = `Analyze the following message for toxicity, hate speech, harassment, bullying, threats, or inappropriate content. 

Message: "${text}"

Respond ONLY with a JSON object in this exact format:
{
  "isToxic": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "categories": ["hate_speech", "harassment", "threats", "profanity", "bullying", etc.]
}

Be strict but fair. Consider context. False positives are better than false negatives for safety.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    // Try to parse JSON response
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isToxic: parsed.isToxic === true,
          confidence: parsed.confidence || 0.5,
          reason: parsed.reason || null,
          categories: parsed.categories || [],
          method: 'gemini'
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse Gemini toxicity response, using fallback:', parseError);
    }

    // Fallback: check if response indicates toxicity
    const lowerResponse = responseText.toLowerCase();
    if (lowerResponse.includes('toxic') || lowerResponse.includes('true') || lowerResponse.includes('yes')) {
      return {
        isToxic: true,
        confidence: 0.7,
        reason: 'AI detected toxicity',
        method: 'gemini-fallback'
      };
    }

    // If response doesn't indicate toxicity, use fallback word filter
    return {
      isToxic: checkToxicityFallback(text),
      confidence: 0.5,
      reason: 'Fallback word filter',
      method: 'fallback'
    };
  } catch (error) {
    console.error('Error checking toxicity with Gemini:', error);
    
    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';
    const errorString = JSON.stringify(error) || '';
    const now = Date.now();
    
    // Check for API not enabled error (403 Forbidden with SERVICE_DISABLED)
    if (errorCode === 403 || errorCode === '403' || 
        errorMessage.includes('SERVICE_DISABLED') || 
        errorMessage.includes('has not been used') ||
        errorMessage.includes('is disabled') ||
        errorMessage.includes('Enable it by visiting') ||
        errorString.includes('SERVICE_DISABLED')) {
      console.warn('⚠️ Generative Language API is not enabled in your Google Cloud project.');
      console.warn('💡 Enable it at: https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview');
      console.warn('📝 Using fallback word filter for toxicity checking.');
      // Set quota exceeded flag to prevent repeated API calls (60 minutes cooldown)
      geminiQuotaExceeded = true;
      quotaExceededUntil = now + (GEMINI_COOLDOWN * 60); // 60 minutes cooldown for API not enabled
    }
    // Check if it's a quota/rate limit error (429)
    else if (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit'))) {
      geminiQuotaExceeded = true;
      quotaExceededUntil = now + GEMINI_COOLDOWN;
      console.warn('Gemini quota exceeded, will use fallback for next', GEMINI_COOLDOWN / 1000, 'seconds');
    }
    
    // Fallback to word filter
    const result = {
      isToxic: checkToxicityFallback(text),
      confidence: 0.5,
      reason: 'Error checking with AI, using fallback',
      method: 'fallback'
    };
    toxicityCache.set(cacheKey, result);
    return result;
  }
};

/**
 * Main toxicity check function - tries Gemini first, falls back to word filter
 * Now with automatic fallback when quota is exceeded
 */
export const checkToxicity = async (text, useGemini = true) => {
  if (!text || typeof text !== 'string') {
    return { isToxic: false, confidence: 0, reason: null, method: 'none' };
  }

  // Check cache first (works for both Gemini and fallback results)
  const cacheKey = text.toLowerCase().trim();
  if (toxicityCache.has(cacheKey)) {
    return toxicityCache.get(cacheKey);
  }

  // AI-powered toxicity checking disabled - only Virtual Senior and RAG Engine are enabled
  // Always use fallback word filter
  if (false && useGemini && !geminiQuotaExceeded) { // Disabled: AI toxicity checking
    try {
      const result = await checkToxicityWithGemini(text);
      // Cache the result (already cached in checkToxicityWithGemini, but ensure it's here too)
      if (!toxicityCache.has(cacheKey)) {
        toxicityCache.set(cacheKey, result);
      }
      return result;
    } catch (error) {
      console.error('Error in Gemini toxicity check:', error);
      // Continue to fallback below
    }
  }

  // Fallback to word filter (always reliable, no API calls)
  const result = {
    isToxic: checkToxicityFallback(text),
    confidence: 0.5,
    reason: 'Word filter',
    method: 'fallback'
  };
  toxicityCache.set(cacheKey, result);
  return result;
};

// Clear cache periodically to prevent memory issues (keep last 1000 entries)
setInterval(() => {
  if (toxicityCache.size > 1000) {
    const entries = Array.from(toxicityCache.entries());
    toxicityCache.clear();
    // Keep most recent 500 entries
    entries.slice(-500).forEach(([key, value]) => {
      toxicityCache.set(key, value);
    });
  }
}, 5 * 60 * 1000); // Every 5 minutes

