export const RESTRICTED_WORDS = [
  // Vietnamese offensive words
  "địt", "đụ", "đ!t", "d!t", "dit", "đjt", "đ1t", "đ.t", "đ*t", "đ.í.t", "đít", 
  "lồn", "lon", "l0n", "l*n", "l.o.n", "loz", "l0z", "lờn", "l.o.z", "lìn",
  "cặc", "cac", "kak", "cak", "c@c", "cặk", "ku", "cu", "kú", "c.", "k.", "cặk",
  "buồi", "buoi", "bú", "đầu buồi", "dau buoi", "bu0i", "bư0i", "bư0j", 
  "đmm", "đm", "đéo", "đéo mẹ", "đ.m.m", "dmm", "d.m", "deo me", "deo",
  "vcl", "vl", "vloz", "v.c.l", "vkl", "v.l", "vcc", "v.c.c",
  "clm", "cl", "con lợn mập", "c.l.m", "cm", "cl0z", 
  "đcm", "đcmm", "cmm", "ccm", "c.c.m", "c.m.m", "cm.m", "cc.m", "lmm", "l.m.m",
  "đĩ", "di~", "đ.ĩ", "đ.i", "đi.", "đ1", "dĩ", "cave", "con đĩ", "thằng đĩ", "đỹ", "điếm", "con điếm",
  "dái", "d@i", "dái chó", "dai cho", "giái", "giai", "zai", "zái",
  "thằng chó", "đồ chó", "con chó", "chó đẻ", "cho de", "ch.ó", "ch0", "c.h.o", 
  "súc vật", "suc vat", "đồ súc vật", "thú vật", "thu vat", 
  "ngu", "óc lợn", "óc chó", "oc cho", "óc bò", "óc lừa", "óc heo",  
  "thằng điên", "thg điên", "thg dien", "thứ tật nguyền", "tật nguyền", "tật nguyên",
  "mọi rợ", "moi ro", "moị rợ", "m0i r0", "mọe", "móe", "m.o.e", "mọe mày", "moe may",
  "tổ sư", "tổ cha", "tổ bà", "tổ tiên", "tổ tông", "tổ mẫu", "cc",
  
  // More Vietnamese offensive variants
  "chet di", "chết đi", "chết mẹ", "chet me", "chết tiệt", "chet tiet",
  "đồ khốn", "do khon", "thằng khốn", "con khốn", "khốn kiếp", "khốn nạn",
  "mẹ mày", "me may", "mẹ m", "má mày", "ma may", "mạ mày", "bà mày", "ba may",
  "cha mày", "ông mày", "mẹ kiếp", "me kiep", "má kiếp", "ma kiep", "bà kiếp", "ba kiep",
  "đụ má", "du ma", "đụ mẹ", "du me", "đụ bà", "du ba", "đụ cha", "du cha", "đụ tổ", "du to",
  "tiên sư", "tien su", "tổ sư", "to su", "tổ cha", "to cha", "tổ mẹ", "to me",
  "cứt", "cut", "cứ.t", "c.ứ.t", "cứk", "cuk", "cứq", "cuq", "unko",
  "đái", "dai", "đ.á.i", "đ*i", "đ@i", "d@i", "d*i", "d.a.i", "đừng", "dung",
  "bướm", "buom", "bướng", "buong", "bướx", "buox", "bướz", "buoz", "bướk", "buok",
  
  // English offensive words
  "fuck", "f*ck", "f**k", "fck", "fuk", "fuking", "f u c k", "fvck", "phuck", "fcuk", "eff", "effing",
  "motherfucker", "mofo", "mf", "m.f.", "mother f*cker", "muthafucka", "mutha fucka", "mothafucka",
  "bitch", "b*tch", "b**ch", "b1tch", "bytch", "b!tch", "biatch", "bi+ch", "b1+ch", "bytch", "bytch",
  "pussy", "p*ssy", "p**sy", "puss", "p.u.s.s.y", "pusy", "pussi", "pusi", "pussie", "pu55y", "pu$$y",
  "dick", "d*ck", "d!ck", "d1ck", "dik", "d**k", "d i c k", "dck", "d!k", "penis", "pen15", "pen1s", "p3nis",
  "cock", "c0ck", "cok", "c*ck", "c**k", "c0k", "schlong", "dong", "d0ng", "shlong", 
  "asshole", "a$$", "a$$hole", "a**hole", "arsehole", "a-hole", "azzhole", "a$$h0le", "ahole", "assh0le",
  "ass", "a$$", "a$", "a$$", "@$", "@$$", "a**", "azz", "@ss", "butt", "booty", "bootie", "bum", "a s s",
  "shit", "sh*t", "sh!t", "sh1t", "s**t", "s h i t", "shyt", "shite", "$hit", "$h1t", "s h i t", "sh!te",
  "bastard", "b@stard", "b@st@rd", "bstrd", "basterd", "b@$t@rd", "b@$tard", "bas+ard", "bas+@rd",
  "damn", "d@mn", "d*mn", "dman", "d@m", "d*m", "damm", "d@mm", "d*mm", "d@**", "d@*", "d@**n",
  "cunt", "c*nt", "c**t", "cvnt", "cnt", "c u n t", "c.u.n.t", "kunt", "k*nt", "k**t",
  "twat", "tw@t", "tw*t", "tw**t", "tw@", "tw*", "tw**", "tw@+", "tw*+", "twa+",
  
  // Common abbreviations and internet slang with offensive meanings
  "wtf", "wth", "stfu", "gtfo", "lmfao", "lmao", "lmbo", "omfg", "ffs", "fu", "f.u.", "af", "bs", "omg",
  "wtaf", "rtfm", "gtfoh", "idgaf", "dilligaf", "jfc", "milf", "gilf", "dilf", "pilf", "filf", "smh", "fml",
  
  // Sexist/misogynistic terms
  "whore", "wh*re", "wh**e", "who*e", "wh0re", "h00ker", "h0oker", "hooker", "hoe", "h0e", 
  "slut", "sl*t", "sl**", "sl*+", "skank", "sk@nk", "sk*nk", "thot", "th0t", "th*t", 
  "ho", "h0", "wench", "w3nch", "strumpet", "tramp", "tr@mp", "tr*mp", "slag", "sl@g", "sl*g",
  
  // Racial/ethnic slurs
  "nigger", "n*gger", "n**ger", "n1gger", "negro", "nigga", "nigg@", "n-word", "nig", "n!gger", "n1gg@",
  "n!gg@", "n!gg3r", "n1gg3r", "negr0", "n3gr0", "n3g", "neger", "negar", "neegar", "nigor", "nigur",
  "chink", "ch1nk", "ch!nk", "ch*nk", "ch**k", "chinky", "chinkie", "ching chong", "chingchong", 
  "gook", "g00k", "g0ok", "g**k", "g*k", "spic", "sp1c", "sp!c", "sp*c", "spick", "sp!ck", "sp1ck",
  "wetback", "w3tback", "w*tback", "wet b@ck", "beaner", "be@ner", "b3aner", "bean3r", "b3@n3r",
  "gringo", "gr1ngo", "gr!ngo", "gr*ngo", "greaser", "gre@ser", "gre@s3r", "gr3@s3r",
  "kike", "k1ke", "k!ke", "k*ke", "kyke", "jew", "j3w", "j*w", "jewboy", "j3wboy", "j*wboy", "jewb0y",
  "raghead", "r@ghead", "r@gh3@d", "towelhead", "t0welhead", "t0w3lh3@d", "sandnigger", "camel jockey",
  "paki", "p@ki", "p@k1", "p*ki", "pakki", "p@kki", "p*kki", "curry muncher", "curry-muncher",
  "jap", "j@p", "j*p", "nip", "n1p", "n!p", "zipperhead", "z1pperhead", "z!pperhead",
  "ape", "monkey", "gorilla", "monke", "g0r1ll@", "m0nkey", "m0nk3y", "m*nkey",
  "gyp", "gypped", "gyppo", "gypsy", "gypo", "gippo", "pikey", "p!key", "p1key",
  
  // Homophobic/transphobic slurs
  "faggot", "f*ggot", "f@ggot", "f@g", "fag", "f@", "f*g", "faggy", "f@ggy", "f*ggy",
  "homo", "h0m0", "h*mo", "fairy", "f@iry", "f*iry", "queer", "qu33r", "qu**r", "dyke", "d*ke", "d1ke",
  "tranny", "tr@nny", "tr*nny", "shemale", "she-male", "she male", "ladyboy", "lady-boy", "l@dyboy",
  "transvestite", "tr@nsvestite", "tr*nsvestite", "trannie", "tr@nnie", "tr*nnie", "trap", "tr@p",
  
  // Ableist language
  "retard", "ret@rd", "r-word", "retarded", "ret@rded", "r*tarded", "r*t*rd*d", "tard", "t@rd", "t*rd",
  "spaz", "sp@z", "sp*z", "spastic", "sp@stic", "sp*stic", "cripple", "cr!pple", "cr1pple", "handicap",
  "lame", "l@me", "l*me", "gimp", "g1mp", "g!mp", "idiot", "1d1ot", "stupid", "stup1d", "stup!d", "dumb",
  
  // Drug related
  "cần sa", "ma túy", "thuốc lắc", "heroin", "cocain", "cocaine", "c0ca1ne", "weed", "crack", "cr@ck",
  "pot", "cannabis", "cann@bis", "c@nnabis", "mdma", "ecstasy", "ecst@sy", "ecs+@sy", "meth", "crystal", 
  "xanax", "x@n@x", "fentanyl", "fent@nyl", "bath salts", "b@th s@lts", "lsd", "acid", "@cid", "@c1d",
  "shrooms", "shr00ms", "magic mushrooms", "m@gic mushr00ms", "datura", "d@tur@", "peyote", "pey0te",
  
  // Self-harm/suicide related
  "suicide", "su1c1de", "su!c!de", "kill yourself", "kys", "k.y.s.", "k y s", "tự tử", "tự sát", "chết đi",
  "hang yourself", "h@ng yourself", "slit your wrists", "sl!t your wrists", "sl1t your wrists",
  
  // Additional Vietnamese filler
  "hộc máu", "hoc mau", "bệch mặt", "bech mat", "con lợn", "thối", "thay đỗ", "thay do", "phìn",
  "tiêm", "tiem", "nghiện", "nghien", "tiêm chích", "tiem chich", "bơm kim", "bom kim", "đâm chết", 
  "dam chet", "giết người", "giet nguoi"
];

/**
 * Checks if text contains any restricted words
 * @param {string} text - The text to check
 * @returns {boolean} - True if the text contains restricted words
 */
export const containsRestrictedWords = (text) => {
  const lowerText = text.toLowerCase();
  return RESTRICTED_WORDS.some(word => lowerText.includes(word));
};