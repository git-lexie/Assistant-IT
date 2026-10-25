// XIE's friendly side. Works offline: it reads the mood in a message and answers with warmth, a small useful action and positive energy.
// It is an AI and says so honestly. It encourages real-life connection and points to real help in a hard moment.
const pick=(a,r)=>a[Math.floor(r()*a.length)];
const NEG=/\b(not|never|no|don'?t|isn'?t|aren'?t|wasn'?t|nothing)\s*(really |very |that |so |too )?$/;
const CRISIS=/\b(suicid\w*|kill (my ?self|me)|end (my|it all)|want to die|wanna die|better off dead|self[- ]?harm|hurt(ing)? my ?self|don'?t want to (live|be here)|no reason to live|take my own life)\b/i;
const LEX=[['overwhelmed',/\b(overwhelm\w*|too much|swamped|buried|so many (tickets|tasks)|can'?t keep up|pressure|deadline|stress\w*)\b/i],
 ['tired',/\b(tired|exhausted|sleepy|drained|burn(ed|t)?[ -]?out|worn out|no energy|fatigued|so sleepy|lack of sleep)\b/i],
 ['lonely',/\b(lonely|alone|isolated|nobody (to talk|cares)|no one (to talk|cares)|miss (my )?(family|friends|home))\b/i],
 ['sad',/\b(sad|down|blue|unhappy|crying|miserable|heartbroken|discouraged|demotivated|gloomy|low)\b/i],
 ['anxious',/\b(anxious|worried|worry|nervous|scared|afraid|panic\w*|uneasy|tense)\b/i],
 ['angry',/\b(angry|mad|annoyed|frustrat\w*|furious|irritated|fed up|so annoying|hate (this|my job|it))\b/i],
 ['bored',/\b(bored|boring|nothing to do)\b/i],
 ['happy',/\b(happy|great day|awesome|excited|proud|yay|good news|finally (fixed|solved|works)|it works|i did it|solved it|promotion|celebrat\w*|feeling good)\b/i]];
export function moodOf(text){for(const [m,re] of LEX){const x=re.exec(text);if(x&&!NEG.test(text.slice(Math.max(0,x.index-22),x.index).toLowerCase()))return m}return null}
export const isCrisis=text=>CRISIS.test(text);
const nm=c=>c.name||'friend';
const f=(s,c)=>s.replace(/\{name\}/g,nm(c)).replace(/\{done\}/g,c.done||0);
const WIN=c=>c.done>0?` You have already closed ${c.done} ticket${c.done>1?'s':''} today — that counts!`:'';
const LATE=c=>c.hour>=22||c.hour<5?' It is getting late, so be kind to yourself and rest soon. 🌙':'';
const M={
 tired:['That sounds like a long day, {name}. 💛 Tired is real. Try a 2-minute reset: stand up, roll your shoulders, sip some water. Want a guided breathing break? Tap 🫶 Break below.','You have been giving a lot, {name}. 🌿 Your energy is not a bottomless cup, and that is okay. Stretch, look out a window for 20 seconds, drink some water. Small things help more than you think.','I hear you, {name}. 😴 One thing at a time today. Pick the easiest ticket first for a quick win, then a short walk. You are doing better than you think.'],
 overwhelmed:['That is a lot on your plate, and feeling swamped makes sense. 💛 Let us shrink it: pick the ONE thing that matters most right now. Just that. The rest can wait ten minutes. Want to tell me what it is?','Deep breath, {name}. 🌬️ Big piles get smaller when we take them one by one. Name your top priority and I will help with the steps.','You are carrying a lot. 💪 Try this: write down everything on your mind, circle the one urgent item, and park the rest. I am happy to help you start.'],
 sad:['I am sorry you are feeling low, {name}. 💛 You do not have to put on a brave face with me. If you want to tell me what is weighing on you, I am listening. A short walk or a message to someone you trust can also lighten things a little.','That sounds heavy, {name}. 🫂 Feelings like this pass, even when they feel big. Be gentle with yourself today. Want to talk about it, or shall I cheer you up with something light?'],
 lonely:['Thank you for telling me, {name}. 🤗 I am here and happy to chat with you right now. I am an app, though, so I also hope you have people around you. Could you message a friend, family member or teammate today? Even a short "hey, how are you?" counts. Meanwhile, tell me about your day.','I am glad you reached out, {name}. 💛 Let us chat for a bit. And if you can, plan one small human moment today: a call, a coffee, or a hello to a colleague. You deserve good company.'],
 anxious:['Let us slow things down together, {name}. 🌿 Breathe in for 4, hold for 4, out for 6. Then try 5-4-3-2-1: name 5 things you see, 4 you can touch, 3 you hear. Worries shrink when we turn them into small steps. What is the first small step?','It is okay to feel nervous, {name}. 💛 You have handled hard things before. Let us break this into the smallest next step. Want a quick breathing break first? Tap 🫶 Break.'],
 angry:['Ugh, that sounds really frustrating, {name}, and your reaction makes sense. 😤 Vent as much as you like. When you are ready, we will tackle it step by step. Deep breath first?','I get it, {name}. Some days things just fight back. 💛 Let it out, take a breath, and then we will find a way through. You are not alone in this.'],
 bored:['Boredom alert! 🎈 Want a joke, a fun fact, or a quick challenge: find three tickets you can close in ten minutes? Just say "joke" or "fun fact".','Let us fix that, {name}! ✨ How about a mini challenge: tidy up your open tickets and add one fix to Knowledge. Or say "joke" if you just want a smile.'],
 happy:['Yay, {name}! 🎉 I love hearing that. What happened? You earned this moment, so enjoy it!','That is wonderful, {name}! 🌟 Your good mood is contagious. Tell me more!','Now that is what I like to hear! 😄 Celebrate it, even with a tiny dance. 💃']};
const PRE={tired:'Sounds like a long day, so let us make this quick. 💛',overwhelmed:'I know it is a lot, so we will take it one step at a time. 💛',sad:'I am sorry it is a rough day. I will help with this one. 💛',lonely:'Glad you are here. Let us sort this out together. 🤗',anxious:'No stress, we will go step by step. 🌿',angry:'I get the frustration, so let us sort it out. 😤➡️🙂',bored:'Let us put that energy to good use! ✨',happy:'Love the energy! 🎉'};
const GREET={morning:['Good morning, {name}! ☀️ Fresh day, fresh start. What shall we tackle first?','Morning, {name}! 🌤️ Grab some water, take a breath, and tell me what is on your plate.'],afternoon:['Good afternoon, {name}! 🌞 How is your day going? Need a hand with anything?','Hey {name}! 😊 Hope the afternoon is treating you well. What can I help with?'],evening:['Good evening, {name}! 🌆 You made it through the day. Anything left I can help with?','Hi {name}! ✨ Winding down? Tell me if something still needs fixing.'],night:['Hi {name}! 🌙 It is quite late. I am happy to help, but remember to rest too.','Still up, {name}? 💤 Let us be quick so you can get some sleep.']};
const slot=h=>h>=22||h<5?'night':h<12?'morning':h<18?'afternoon':'evening';
const JOKES=['Why did the PC go to the doctor? It caught a virus. 🦠😄','There are 10 types of people: those who understand binary and those who do not. 🤓','Why do programmers prefer dark mode? Because light attracts bugs! 🐛','I would tell you a UDP joke, but you might not get it. 😅','My Wi-Fi and I have a lot in common: we both disappear when it matters most. 📶😂','Why was the computer cold? It left its Windows open! 🪟❄️','To err is human. To really mess things up you need a computer. 💻'];
const FACTS=['Fun fact: the first computer "bug" was a real moth found in a Harvard Mark II relay in 1947. 🦋','Fun fact: the @ sign in email addresses was chosen by Ray Tomlinson in 1971. ✉️','Fun fact: the first 1 GB hard drive (IBM, 1980) weighed over 500 pounds. 😮','Fun fact: honey found in ancient Egyptian tombs was still edible. 🍯','Fun fact: octopuses have three hearts. 🐙','Fun fact: the first website is still online. 🌐'];
const BOOST=['{name}, every ticket you close makes someone\'s day easier. ✨ You are the person people call when things break, and that matters.','Reminder, {name}: you do not need to be perfect, just keep going one step at a time. 💪','Hard problems are just puzzles that have not met you yet. 🧩 You have solved harder ones before.','You are learning and growing with every issue you fix, {name}. 🌱 That is real progress.','Take a breath, roll your shoulders, and smile for a second. 😊 You have got this, {name}!'];
const NIGHT=['Good night, {name}! 🌙 Be proud of what you did today. Rest well, tomorrow is a fresh start. 💤','Sleep well, {name}! ⭐ You did enough today.'];
const BYE=['See you soon, {name}! 👋 Take care of yourself.','Bye for now, {name}! 😊 Drink some water and stretch on your way out.'];
const HOW=['I am in great spirits and ready to help! ☀️ Thanks for asking, {name}. And you, how is your energy right now?','Doing well and happy you are here! 😊 How about you, {name}?'];
const THX=['Anytime, {name}! 😊','Happy to help, {name}! 🌟 Shout if anything else pops up.'];
const PRAISE=['Aww, thank you, {name}! 🥰 You make it easy. We make a good team!','That made my day, {name}! 😄 You are great to work with.'];
const REAL=['I am an AI assistant, not a human. 😊 I am built to be warm, to listen and to help, and I run right on your device. I cannot replace real people, but I am happy to keep you company while you work.'];
const CHAT=['I am here, {name}. 🤗 Tell me about your day: what was the best part, and what was the hardest?','Of course, {name}! 💛 What is on your mind? Big or small, I am listening.'];
const BREAK=['Great idea, {name}. 🫶 A 2-minute break can reset your whole afternoon. Let us breathe together.'];
const NAME=['Nice to meet you, {name}! 😄 I will remember it on this device.'];
export const checkin=c=>f(pick(GREET[slot(c.hour)],c.rnd||Math.random),c)+(c.done>0?` Yesterday and today you closed ${c.done} ticket${c.done>1?'s':''}. Nice work!`:'');
export const celebrate=c=>pick(['🎉 Nice work, {name}! Another one closed. XIE saved the fix so we can reuse it.','✅ Done and dusted, {name}! 🌟 You are on a roll.','🥳 Ticket closed! {name}, that is {done} today. Treat yourself to a sip of water and a stretch.'],c.rnd||Math.random).replace(/\{name\}/g,nm(c)).replace(/\{done\}/g,c.done||1);
export const boost=c=>f(pick(BOOST,c.rnd||Math.random),c)+WIN(c)+LATE(c);
/** Returns null when the message is not personal. Otherwise {kind,text,preface?,solo?,mood?,action?,setName?}. Crisis is checked first. */
export function companion(text,c){const r=c.rnd||Math.random,low=text.toLowerCase().trim();
 if(CRISIS.test(low))return{kind:'crisis'};
 const nameM=/\b(?:my name is|call me|i am called)\s+([A-Za-z][A-Za-z'-]{1,19})/i.exec(text);if(nameM){const n=nameM[1][0].toUpperCase()+nameM[1].slice(1);return{kind:'chat',solo:true,setName:n,text:f(pick(NAME,r),{...c,name:n})}}
 const short=low.split(/\s+/).length<=4,say=(a,extra='')=>({kind:'chat',solo:true,text:f(pick(a,r),c)+extra});
 if(/(are you (a )?(real|human|person|robot|ai|bot|alive)|is this a real person|who (made|created) you)/.test(low))return say(REAL);
 if(/\b(joke|make me laugh|something funny)\b/.test(low))return say(JOKES);
 if(/(fun fact|tell me something|something interesting|did you know)/.test(low))return say(FACTS);
 if(/(motivate|cheer me up|encourage|inspire|pep talk|need energy|boost me|energi[sz]e)/.test(low))return{kind:'chat',solo:true,text:boost(c)};
 if(/(take a break|need a break|break time|breathe|breathing|relax|calm down)/.test(low))return{...say(BREAK),action:'breathe'};
 if(/(talk to me|chat with me|keep me company|be my friend|need (someone|a friend) to talk|can we talk|just talk)/.test(low)){const lonely=(c.lonely||0)>=3?' By the way, I would love for you to also share this with someone close to you. Real friends are the best company. 💛':'';return{kind:'mood',mood:'lonely',text:f(pick(CHAT,r),c)+lonely,solo:true}}
 if(/good ?night|going to sleep|heading to bed|logging off|signing off/.test(low))return say(NIGHT,c.done>0?` You closed ${c.done} today!`:'');
 if(/^(bye|goodbye|see you|cya|later)\b/.test(low))return say(BYE);
 if(/how are you|how'?s it going|how do you feel|what'?s up|^sup\b/.test(low))return say(HOW);
 if(/^(hi|hello|hey|yo|hiya|howdy|morning|good (morning|afternoon|evening))\b/.test(low)&&short)return say(GREET[slot(c.hour)]);
 if(/(thank|thanks|thx|salamat|gracias)/.test(low)&&short)return say(THX);
 if(/(you('| a)re (the best|awesome|great|amazing|helpful|smart)|love you|good bot|good job)/.test(low))return say(PRAISE);
 const m=moodOf(low);if(m){const lonelyNudge=m==='lonely'&&(c.lonely||0)>=3?' I have noticed you have felt this way a few times lately. Please consider talking to someone you trust, too. 💛':'';
  return{kind:'mood',mood:m,text:f(pick(M[m],r),c)+WIN(c)+LATE(c)+lonelyNudge,preface:PRE[m],offerBreathe:['tired','overwhelmed','anxious','angry','sad'].includes(m)}}
 return null}
export const moodReply=(m,c)=>({kind:'mood',mood:m,text:f(pick(M[m]||M.happy,c.rnd||Math.random),c)+WIN(c)+LATE(c)});
export const MOODS=['happy','tired','overwhelmed','sad','angry'];
