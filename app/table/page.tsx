"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Lightbulb,
  Rocket,
  Heart,
  Paintbrush,
  Brain,
} from "lucide-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { motion, AnimatePresence } from "framer-motion";
import {
  SubtleTab,
  SubtleTabItem,
  SubtleTabPanel,
} from "@/registry/default/subtle-tab";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/registry/default/table";
import { fontWeights } from "@/registry/default/lib/font-weight";
import { springs } from "@/registry/default/lib/springs";

// ── Data ──────────────────────────────────────────────────

interface Quote {
  id: string;
  author: string;
  text: string;
  tag: string;
}

const tabs = [
  { icon: Lightbulb, label: "Wisdom" },
  { icon: Rocket, label: "Ambition" },
  { icon: Heart, label: "Love & Life" },
  { icon: Paintbrush, label: "Creativity" },
  { icon: Brain, label: "Philosophy" },
] as const;

const quotes: Record<string, Quote[]> = {
  Wisdom: [
    { id: "w1", author: "Marcus Aurelius", text: "The happiness of your life depends upon the quality of your thoughts.", tag: "Mindset" },
    { id: "w2", author: "Seneca", text: "We suffer more often in imagination than in reality.", tag: "Perception" },
    { id: "w3", author: "Epictetus", text: "It is not what happens to you, but how you react to it that matters.", tag: "Resilience" },
    { id: "w4", author: "Lao Tzu", text: "A journey of a thousand miles begins with a single step.", tag: "Action" },
    { id: "w5", author: "Confucius", text: "It does not matter how slowly you go as long as you do not stop.", tag: "Persistence" },
    { id: "w6", author: "Socrates", text: "The unexamined life is not worth living.", tag: "Reflection" },
    { id: "w7", author: "Aristotle", text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", tag: "Discipline" },
    { id: "w8", author: "Buddha", text: "The mind is everything. What you think you become.", tag: "Mindset" },
    { id: "w9", author: "Rumi", text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", tag: "Growth" },
    { id: "w10", author: "Thich Nhat Hanh", text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", tag: "Presence" },
    { id: "w11", author: "Marcus Aurelius", text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", tag: "Simplicity" },
    { id: "w12", author: "Seneca", text: "It is not that we have a short time to live, but that we waste a great deal of it.", tag: "Time" },
    { id: "w13", author: "Epictetus", text: "No man is free who is not master of himself.", tag: "Discipline" },
    { id: "w14", author: "Lao Tzu", text: "When I let go of what I am, I become what I might be.", tag: "Growth" },
    { id: "w15", author: "Confucius", text: "Real knowledge is to know the extent of one's ignorance.", tag: "Humility" },
    { id: "w16", author: "Socrates", text: "I know that I know nothing.", tag: "Humility" },
    { id: "w17", author: "Aristotle", text: "Knowing yourself is the beginning of all wisdom.", tag: "Reflection" },
    { id: "w18", author: "Buddha", text: "Peace comes from within. Do not seek it without.", tag: "Presence" },
    { id: "w19", author: "Rumi", text: "The wound is the place where the Light enters you.", tag: "Resilience" },
    { id: "w20", author: "Thich Nhat Hanh", text: "Smile, breathe, and go slowly.", tag: "Presence" },
    { id: "w21", author: "Marcus Aurelius", text: "You have power over your mind — not outside events. Realize this, and you will find strength.", tag: "Mindset" },
    { id: "w22", author: "Seneca", text: "Luck is what happens when preparation meets opportunity.", tag: "Action" },
    { id: "w23", author: "Epictetus", text: "First say to yourself what you would be; and then do what you have to do.", tag: "Action" },
    { id: "w24", author: "Lao Tzu", text: "Nature does not hurry, yet everything is accomplished.", tag: "Patience" },
    { id: "w25", author: "Confucius", text: "The man who moves a mountain begins by carrying away small stones.", tag: "Persistence" },
    { id: "w26", author: "Socrates", text: "Be kind, for everyone you meet is fighting a hard battle.", tag: "Compassion" },
    { id: "w27", author: "Aristotle", text: "It is the mark of an educated mind to entertain a thought without accepting it.", tag: "Reflection" },
    { id: "w28", author: "Buddha", text: "Three things cannot be long hidden: the sun, the moon, and the truth.", tag: "Truth" },
    { id: "w29", author: "Rumi", text: "Let yourself be silently drawn by the strange pull of what you really love.", tag: "Purpose" },
    { id: "w30", author: "Thich Nhat Hanh", text: "Because you are alive, everything is possible.", tag: "Possibility" },
    { id: "w31", author: "Marcus Aurelius", text: "The best revenge is to be unlike him who performed the injury.", tag: "Character" },
    { id: "w32", author: "Seneca", text: "Difficulties strengthen the mind, as labor does the body.", tag: "Resilience" },
    { id: "w33", author: "Epictetus", text: "Wealth consists not in having great possessions, but in having few wants.", tag: "Simplicity" },
    { id: "w34", author: "Lao Tzu", text: "He who knows others is wise. He who knows himself is enlightened.", tag: "Reflection" },
    { id: "w35", author: "Confucius", text: "Before you embark on a journey of revenge, dig two graves.", tag: "Wisdom" },
    { id: "w36", author: "Seneca", text: "As is a tale, so is life: not how long it is, but how good it is, is what matters.", tag: "Purpose" },
    { id: "w37", author: "Buddha", text: "In the end, only three things matter: how much you loved, how gently you lived, and how gracefully you let go.", tag: "Letting go" },
    { id: "w38", author: "Rumi", text: "Silence is the language of God; all else is poor translation.", tag: "Presence" },
    { id: "w39", author: "Marcus Aurelius", text: "When you arise in the morning, think of what a precious privilege it is to be alive.", tag: "Gratitude" },
    { id: "w40", author: "Lao Tzu", text: "The wise man is one who knows what he does not know.", tag: "Humility" },
    { id: "w41", author: "Epictetus", text: "If you want to improve, be content to be thought foolish and stupid.", tag: "Growth" },
    { id: "w42", author: "Confucius", text: "To see what is right and not do it is want of courage.", tag: "Courage" },
    { id: "w43", author: "Socrates", text: "Strong minds discuss ideas, average minds discuss events, weak minds discuss people.", tag: "Character" },
    { id: "w44", author: "Aristotle", text: "Patience is bitter, but its fruit is sweet.", tag: "Patience" },
    { id: "w45", author: "Buddha", text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", tag: "Presence" },
    { id: "w46", author: "Thich Nhat Hanh", text: "To be beautiful means to be yourself. You don't need to be accepted by others.", tag: "Authenticity" },
    { id: "w47", author: "Rumi", text: "What you seek is seeking you.", tag: "Purpose" },
    { id: "w48", author: "Seneca", text: "Begin at once to live, and count each separate day as a separate life.", tag: "Time" },
    { id: "w49", author: "Marcus Aurelius", text: "Waste no more time arguing about what a good man should be. Be one.", tag: "Action" },
    { id: "w50", author: "Lao Tzu", text: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.", tag: "Love" },
  ],
  Ambition: [
    { id: "a1", author: "Steve Jobs", text: "Stay hungry, stay foolish.", tag: "Drive" },
    { id: "a2", author: "Elon Musk", text: "When something is important enough, you do it even if the odds are not in your favor.", tag: "Determination" },
    { id: "a3", author: "Naval Ravikant", text: "Seek wealth, not money or status. Wealth is having assets that earn while you sleep.", tag: "Leverage" },
    { id: "a4", author: "Jeff Bezos", text: "I knew that if I failed I wouldn't regret that, but I knew the one thing I might regret is not trying.", tag: "Risk" },
    { id: "a5", author: "Peter Thiel", text: "Competition is for losers. If you want to create and capture lasting value, build a monopoly.", tag: "Strategy" },
    { id: "a6", author: "Paul Graham", text: "Live in the future, then build what's missing.", tag: "Vision" },
    { id: "a7", author: "Marc Andreessen", text: "The best way to predict the future is to invent it.", tag: "Innovation" },
    { id: "a8", author: "Sam Altman", text: "It's easier to do a hard startup than an easy startup.", tag: "Ambition" },
    { id: "a9", author: "Winston Churchill", text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", tag: "Perseverance" },
    { id: "a10", author: "Theodore Roosevelt", text: "It is hard to fail, but it is worse never to have tried to succeed.", tag: "Risk" },
    { id: "a11", author: "Nelson Mandela", text: "It always seems impossible until it's done.", tag: "Determination" },
    { id: "a12", author: "Marie Curie", text: "Nothing in life is to be feared, it is only to be understood.", tag: "Courage" },
    { id: "a13", author: "Albert Einstein", text: "Imagination is more important than knowledge.", tag: "Vision" },
    { id: "a14", author: "Nikola Tesla", text: "The present is theirs; the future, for which I really worked, is mine.", tag: "Long-term" },
    { id: "a15", author: "Thomas Edison", text: "I have not failed. I've just found 10,000 ways that won't work.", tag: "Perseverance" },
    { id: "a16", author: "Henry Ford", text: "Whether you think you can, or you think you can't — you're right.", tag: "Mindset" },
    { id: "a17", author: "Steve Jobs", text: "The people who are crazy enough to think they can change the world are the ones who do.", tag: "Vision" },
    { id: "a18", author: "Naval Ravikant", text: "Play long-term games with long-term people.", tag: "Strategy" },
    { id: "a19", author: "Jeff Bezos", text: "Your brand is what people say about you when you're not in the room.", tag: "Reputation" },
    { id: "a20", author: "Elon Musk", text: "Failure is an option here. If things are not failing, you are not innovating enough.", tag: "Innovation" },
    { id: "a21", author: "Peter Thiel", text: "The most contrarian thing of all is not to oppose the crowd but to think for yourself.", tag: "Independence" },
    { id: "a22", author: "Paul Graham", text: "The way to get startup ideas is not to try to think of startup ideas.", tag: "Curiosity" },
    { id: "a23", author: "Benjamin Franklin", text: "An investment in knowledge pays the best interest.", tag: "Learning" },
    { id: "a24", author: "Warren Buffett", text: "The most important investment you can make is in yourself.", tag: "Learning" },
    { id: "a25", author: "Charlie Munger", text: "The big money is not in the buying and selling, but in the waiting.", tag: "Patience" },
    { id: "a26", author: "Richard Branson", text: "Screw it, let's do it.", tag: "Action" },
    { id: "a27", author: "Oprah Winfrey", text: "The biggest adventure you can take is to live the life of your dreams.", tag: "Courage" },
    { id: "a28", author: "Mark Twain", text: "Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did.", tag: "Regret" },
    { id: "a29", author: "Walt Disney", text: "All our dreams can come true, if we have the courage to pursue them.", tag: "Courage" },
    { id: "a30", author: "Steve Jobs", text: "Your time is limited, so don't waste it living someone else's life.", tag: "Authenticity" },
    { id: "a31", author: "Naval Ravikant", text: "Earn with your mind, not your time.", tag: "Leverage" },
    { id: "a32", author: "Elon Musk", text: "I think it is possible for ordinary people to choose to be extraordinary.", tag: "Ambition" },
    { id: "a33", author: "Jeff Bezos", text: "In the end, we are our choices.", tag: "Character" },
    { id: "a34", author: "Albert Einstein", text: "Try not to become a man of success. Rather become a man of value.", tag: "Values" },
    { id: "a35", author: "Winston Churchill", text: "If you're going through hell, keep going.", tag: "Perseverance" },
    { id: "a36", author: "Theodore Roosevelt", text: "Do what you can, with what you have, where you are.", tag: "Action" },
    { id: "a37", author: "Nelson Mandela", text: "I learned that courage was not the absence of fear, but the triumph over it.", tag: "Courage" },
    { id: "a38", author: "Marie Curie", text: "Be less curious about people and more curious about ideas.", tag: "Focus" },
    { id: "a39", author: "Henry Ford", text: "Coming together is a beginning, staying together is progress, and working together is success.", tag: "Teamwork" },
    { id: "a40", author: "Sam Altman", text: "Great execution is at least ten times more important than a great idea.", tag: "Execution" },
    { id: "a41", author: "Paul Graham", text: "A startup is a company designed to grow fast.", tag: "Growth" },
    { id: "a42", author: "Peter Thiel", text: "Brilliant thinking is rare, but courage is in even shorter supply than genius.", tag: "Courage" },
    { id: "a43", author: "Warren Buffett", text: "It takes 20 years to build a reputation and five minutes to ruin it.", tag: "Reputation" },
    { id: "a44", author: "Charlie Munger", text: "Knowing what you don't know is more useful than being brilliant.", tag: "Humility" },
    { id: "a45", author: "Mark Twain", text: "The secret of getting ahead is getting started.", tag: "Action" },
    { id: "a46", author: "Nikola Tesla", text: "I don't care that they stole my idea. I care that they don't have any of their own.", tag: "Innovation" },
    { id: "a47", author: "Thomas Edison", text: "Genius is one percent inspiration and ninety-nine percent perspiration.", tag: "Work" },
    { id: "a48", author: "Steve Jobs", text: "Innovation distinguishes between a leader and a follower.", tag: "Innovation" },
    { id: "a49", author: "Naval Ravikant", text: "Free people make free choices. Free choices mean you get unequal outcomes.", tag: "Freedom" },
    { id: "a50", author: "Elon Musk", text: "Persistence is very important. You should not give up unless you are forced to give up.", tag: "Perseverance" },
  ],
  "Love & Life": [
    { id: "l1", author: "Antoine de Saint-Exupéry", text: "It is only with the heart that one can see rightly; what is essential is invisible to the eye.", tag: "Perception" },
    { id: "l2", author: "Victor Hugo", text: "Life is the flower for which love is the honey.", tag: "Beauty" },
    { id: "l3", author: "Maya Angelou", text: "There is no greater agony than bearing an untold story inside you.", tag: "Expression" },
    { id: "l4", author: "Khalil Gibran", text: "You talk when you cease to be at peace with your thoughts.", tag: "Silence" },
    { id: "l5", author: "Oscar Wilde", text: "To live is the rarest thing in the world. Most people exist, that is all.", tag: "Living" },
    { id: "l6", author: "Pablo Neruda", text: "I love you without knowing how, or when, or from where.", tag: "Love" },
    { id: "l7", author: "Jane Austen", text: "There is nothing I would not do for those who are really my friends.", tag: "Friendship" },
    { id: "l8", author: "Leo Tolstoy", text: "All happy families are alike; each unhappy family is unhappy in its own way.", tag: "Family" },
    { id: "l9", author: "Gabriel García Márquez", text: "No matter what, nobody can take away the dances you've already had.", tag: "Memory" },
    { id: "l10", author: "Fyodor Dostoevsky", text: "The soul is healed by being with children.", tag: "Innocence" },
    { id: "l11", author: "Dalai Lama", text: "Genuine love should first be directed at oneself. If we do not love ourselves, how can we love others?", tag: "Self-love" },
    { id: "l12", author: "George Sand", text: "There is only one happiness in this life, to love and be loved.", tag: "Love" },
    { id: "l13", author: "Aldous Huxley", text: "Experience is not what happens to a man. It is what a man does with what happens to him.", tag: "Experience" },
    { id: "l14", author: "Antoine de Saint-Exupéry", text: "Love does not consist of gazing at each other, but in looking together in the same direction.", tag: "Partnership" },
    { id: "l15", author: "Maya Angelou", text: "We delight in the beauty of the butterfly, but rarely admit the changes it has gone through.", tag: "Growth" },
    { id: "l16", author: "Khalil Gibran", text: "If you love somebody, let them go, for if they return, they were always yours.", tag: "Freedom" },
    { id: "l17", author: "Oscar Wilde", text: "Be yourself; everyone else is already taken.", tag: "Authenticity" },
    { id: "l18", author: "Victor Hugo", text: "Even the darkest night will end and the sun will rise.", tag: "Hope" },
    { id: "l19", author: "Leo Tolstoy", text: "If you want to be happy, be.", tag: "Simplicity" },
    { id: "l20", author: "Pablo Neruda", text: "In one kiss, you'll know all I haven't said.", tag: "Love" },
    { id: "l21", author: "Gabriel García Márquez", text: "It is not true that people stop pursuing dreams because they grow old, they grow old because they stop pursuing dreams.", tag: "Youth" },
    { id: "l22", author: "Fyodor Dostoevsky", text: "To love someone means to see them as God intended them.", tag: "Acceptance" },
    { id: "l23", author: "Jane Austen", text: "We are all fools in love.", tag: "Vulnerability" },
    { id: "l24", author: "Dalai Lama", text: "Be kind whenever possible. It is always possible.", tag: "Kindness" },
    { id: "l25", author: "Maya Angelou", text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", tag: "Impact" },
    { id: "l26", author: "Khalil Gibran", text: "Your children are not your children. They are the sons and daughters of Life's longing for itself.", tag: "Parenting" },
    { id: "l27", author: "Oscar Wilde", text: "The heart was made to be broken.", tag: "Vulnerability" },
    { id: "l28", author: "Leo Tolstoy", text: "Everyone thinks of changing the world, but no one thinks of changing himself.", tag: "Self" },
    { id: "l29", author: "Victor Hugo", text: "The greatest happiness of life is the conviction that we are loved.", tag: "Love" },
    { id: "l30", author: "Antoine de Saint-Exupéry", text: "What makes the desert beautiful is that somewhere it hides a well.", tag: "Hope" },
    { id: "l31", author: "Gabriel García Márquez", text: "Always remember that the most important thing in a good marriage is not happiness, but stability.", tag: "Partnership" },
    { id: "l32", author: "Fyodor Dostoevsky", text: "Pain and suffering are always inevitable for a large intelligence and a deep heart.", tag: "Sensitivity" },
    { id: "l33", author: "Jane Austen", text: "A lady's imagination is very rapid; it jumps from admiration to love, from love to matrimony in a moment.", tag: "Romance" },
    { id: "l34", author: "Pablo Neruda", text: "I want to do with you what spring does with the cherry trees.", tag: "Desire" },
    { id: "l35", author: "Dalai Lama", text: "Happiness is not something ready-made. It comes from your own actions.", tag: "Agency" },
    { id: "l36", author: "Maya Angelou", text: "Love recognizes no barriers. It jumps hurdles, leaps fences, penetrates walls to arrive at its destination full of hope.", tag: "Love" },
    { id: "l37", author: "Khalil Gibran", text: "Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.", tag: "Resilience" },
    { id: "l38", author: "Oscar Wilde", text: "Who, being loved, is poor?", tag: "Richness" },
    { id: "l39", author: "George Sand", text: "Guard well within yourself that treasure, kindness. Know how to give without hesitation.", tag: "Generosity" },
    { id: "l40", author: "Aldous Huxley", text: "There is only one corner of the universe you can be certain of improving, and that's your own self.", tag: "Self" },
    { id: "l41", author: "Leo Tolstoy", text: "True life is lived when tiny changes occur.", tag: "Change" },
    { id: "l42", author: "Victor Hugo", text: "To love another person is to see the face of God.", tag: "Divinity" },
    { id: "l43", author: "Antoine de Saint-Exupéry", text: "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.", tag: "Simplicity" },
    { id: "l44", author: "Gabriel García Márquez", text: "He who awaits much can expect little.", tag: "Detachment" },
    { id: "l45", author: "Fyodor Dostoevsky", text: "Beauty will save the world.", tag: "Beauty" },
    { id: "l46", author: "Jane Austen", text: "I declare after all there is no enjoyment like reading!", tag: "Joy" },
    { id: "l47", author: "Pablo Neruda", text: "You can cut all the flowers but you cannot keep Spring from coming.", tag: "Renewal" },
    { id: "l48", author: "Dalai Lama", text: "The purpose of our lives is to be happy.", tag: "Purpose" },
    { id: "l49", author: "Maya Angelou", text: "If you're always trying to be normal you will never know how amazing you can be.", tag: "Uniqueness" },
    { id: "l50", author: "Khalil Gibran", text: "And ever has it been known that love knows not its own depth until the hour of separation.", tag: "Loss" },
  ],
  Creativity: [
    { id: "c1", author: "Dieter Rams", text: "Less, but better.", tag: "Minimalism" },
    { id: "c2", author: "Jony Ive", text: "Simplicity is not the absence of clutter; that's a consequence of simplicity.", tag: "Simplicity" },
    { id: "c3", author: "Pablo Picasso", text: "Every child is an artist. The problem is how to remain an artist once we grow up.", tag: "Innocence" },
    { id: "c4", author: "Steve Jobs", text: "Design is not just what it looks like and feels like. Design is how it works.", tag: "Function" },
    { id: "c5", author: "Paul Rand", text: "Design is the silent ambassador of your brand.", tag: "Identity" },
    { id: "c6", author: "Massimo Vignelli", text: "The life of a designer is a life of fight. Fight against the ugliness.", tag: "Purpose" },
    { id: "c7", author: "Charles Eames", text: "The details are not the details. They make the design.", tag: "Craft" },
    { id: "c8", author: "Frank Lloyd Wright", text: "Less is more only when more is too much.", tag: "Balance" },
    { id: "c9", author: "Leonardo da Vinci", text: "Simplicity is the ultimate sophistication.", tag: "Elegance" },
    { id: "c10", author: "Vincent van Gogh", text: "I dream my painting, and I paint my dream.", tag: "Vision" },
    { id: "c11", author: "Dieter Rams", text: "Good design is as little design as possible.", tag: "Restraint" },
    { id: "c12", author: "Jony Ive", text: "True simplicity is derived from so much more than just the absence of clutter and ornamentation.", tag: "Depth" },
    { id: "c13", author: "Pablo Picasso", text: "The meaning of life is to find your gift. The purpose of life is to give it away.", tag: "Purpose" },
    { id: "c14", author: "Henri Matisse", text: "Creativity takes courage.", tag: "Courage" },
    { id: "c15", author: "Paul Rand", text: "Don't try to be original, just try to be good.", tag: "Quality" },
    { id: "c16", author: "Massimo Vignelli", text: "If you can design one thing, you can design everything.", tag: "Universality" },
    { id: "c17", author: "Charles Eames", text: "Recognizing the need is the primary condition for design.", tag: "Empathy" },
    { id: "c18", author: "Frank Lloyd Wright", text: "You can use an eraser on the drafting table or a sledgehammer on the construction site.", tag: "Planning" },
    { id: "c19", author: "Leonardo da Vinci", text: "Art is never finished, only abandoned.", tag: "Process" },
    { id: "c20", author: "Vincent van Gogh", text: "If you hear a voice within you say 'you cannot paint,' then by all means paint, and that voice will be silenced.", tag: "Self-doubt" },
    { id: "c21", author: "Georgia O'Keeffe", text: "I found I could say things with color and shapes that I couldn't say any other way.", tag: "Expression" },
    { id: "c22", author: "Dieter Rams", text: "My heart belongs to the details. I actually always found them to be more important than the big picture.", tag: "Craft" },
    { id: "c23", author: "Jony Ive", text: "We try to develop products that seem somehow inevitable.", tag: "Inevitability" },
    { id: "c24", author: "Pablo Picasso", text: "Learn the rules like a pro, so you can break them like an artist.", tag: "Mastery" },
    { id: "c25", author: "Paul Rand", text: "Everything is design. Everything!", tag: "Perspective" },
    { id: "c26", author: "Massimo Vignelli", text: "Styles come and go. Good design is a language, not a style.", tag: "Timelessness" },
    { id: "c27", author: "Charles Eames", text: "Design is a plan for arranging elements in such a way as best to accomplish a particular purpose.", tag: "Intent" },
    { id: "c28", author: "Leonardo da Vinci", text: "Learning never exhausts the mind.", tag: "Curiosity" },
    { id: "c29", author: "Vincent van Gogh", text: "I would rather die of passion than of boredom.", tag: "Intensity" },
    { id: "c30", author: "Henri Matisse", text: "An artist must not feel under any constraint.", tag: "Freedom" },
    { id: "c31", author: "Georgia O'Keeffe", text: "I've been absolutely terrified every moment of my life and I've never let it keep me from doing a single thing.", tag: "Courage" },
    { id: "c32", author: "Frank Lloyd Wright", text: "Study nature, love nature, stay close to nature. It will never fail you.", tag: "Nature" },
    { id: "c33", author: "Dieter Rams", text: "Indifference towards people and the reality in which they live is actually the one and only cardinal sin in design.", tag: "Empathy" },
    { id: "c34", author: "Jony Ive", text: "The best products don't try to be noticed. They try to be useful.", tag: "Service" },
    { id: "c35", author: "Pablo Picasso", text: "Inspiration exists, but it has to find you working.", tag: "Discipline" },
    { id: "c36", author: "Paul Rand", text: "Simplicity is not the goal. It is the by-product of a good idea and modest expectations.", tag: "Process" },
    { id: "c37", author: "Leonardo da Vinci", text: "The noblest pleasure is the joy of understanding.", tag: "Understanding" },
    { id: "c38", author: "Vincent van Gogh", text: "Great things are done by a series of small things brought together.", tag: "Process" },
    { id: "c39", author: "Charles Eames", text: "Who ever said that pleasure wasn't functional?", tag: "Joy" },
    { id: "c40", author: "Massimo Vignelli", text: "There is no design without discipline. There is no discipline without intelligence.", tag: "Rigor" },
    { id: "c41", author: "Henri Matisse", text: "There are always flowers for those who want to see them.", tag: "Perception" },
    { id: "c42", author: "Georgia O'Keeffe", text: "To create one's world in any of the arts takes courage.", tag: "Bravery" },
    { id: "c43", author: "Frank Lloyd Wright", text: "Every great architect is — necessarily — a great poet.", tag: "Poetry" },
    { id: "c44", author: "Dieter Rams", text: "Being a designer is more than fulfilling a function. Design has to convey values.", tag: "Values" },
    { id: "c45", author: "Jony Ive", text: "Different and new is relatively easy. Doing something that's genuinely better is very hard.", tag: "Excellence" },
    { id: "c46", author: "Pablo Picasso", text: "Art washes away from the soul the dust of everyday life.", tag: "Renewal" },
    { id: "c47", author: "Paul Rand", text: "The role of the designer is that of a good host, anticipating the needs of the guest.", tag: "Service" },
    { id: "c48", author: "Leonardo da Vinci", text: "Where the spirit does not work with the hand, there is no art.", tag: "Craft" },
    { id: "c49", author: "Vincent van Gogh", text: "Normality is a paved road: it's comfortable to walk, but no flowers grow on it.", tag: "Originality" },
    { id: "c50", author: "Charles Eames", text: "Eventually everything connects — people, ideas, objects. The quality of the connections is the key to quality.", tag: "Connection" },
  ],
  Philosophy: [
    { id: "p1", author: "Friedrich Nietzsche", text: "He who has a why to live can bear almost any how.", tag: "Purpose" },
    { id: "p2", author: "Albert Camus", text: "In the depth of winter, I finally learned that within me there lay an invincible summer.", tag: "Resilience" },
    { id: "p3", author: "Simone de Beauvoir", text: "One is not born, but rather becomes, a woman.", tag: "Identity" },
    { id: "p4", author: "Jean-Paul Sartre", text: "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does.", tag: "Freedom" },
    { id: "p5", author: "Hannah Arendt", text: "The sad truth is that most evil is done by people who never make up their minds to be good or evil.", tag: "Morality" },
    { id: "p6", author: "Immanuel Kant", text: "Two things fill the mind with ever new admiration: the starry heavens above me and the moral law within me.", tag: "Wonder" },
    { id: "p7", author: "Blaise Pascal", text: "All of humanity's problems stem from man's inability to sit quietly in a room alone.", tag: "Stillness" },
    { id: "p8", author: "Søren Kierkegaard", text: "Life can only be understood backwards; but it must be lived forwards.", tag: "Time" },
    { id: "p9", author: "Ralph Waldo Emerson", text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", tag: "Authenticity" },
    { id: "p10", author: "Henry David Thoreau", text: "The mass of men lead lives of quiet desperation.", tag: "Awareness" },
    { id: "p11", author: "Friedrich Nietzsche", text: "Without music, life would be a mistake.", tag: "Art" },
    { id: "p12", author: "Albert Camus", text: "One must imagine Sisyphus happy.", tag: "Absurdism" },
    { id: "p13", author: "Simone de Beauvoir", text: "I am too intelligent, too demanding, and too resourceful for anyone to be able to take charge of me entirely.", tag: "Independence" },
    { id: "p14", author: "Jean-Paul Sartre", text: "Existence precedes essence.", tag: "Existentialism" },
    { id: "p15", author: "Hannah Arendt", text: "Forgiveness is the key to action and freedom.", tag: "Forgiveness" },
    { id: "p16", author: "Immanuel Kant", text: "Dare to know! Have the courage to use your own understanding.", tag: "Reason" },
    { id: "p17", author: "Blaise Pascal", text: "The heart has its reasons which reason knows nothing of.", tag: "Intuition" },
    { id: "p18", author: "Søren Kierkegaard", text: "Anxiety is the dizziness of freedom.", tag: "Freedom" },
    { id: "p19", author: "Ralph Waldo Emerson", text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", tag: "Self" },
    { id: "p20", author: "Henry David Thoreau", text: "Go confidently in the direction of your dreams. Live the life you have imagined.", tag: "Courage" },
    { id: "p21", author: "Friedrich Nietzsche", text: "That which does not kill us makes us stronger.", tag: "Strength" },
    { id: "p22", author: "Albert Camus", text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", tag: "Rebellion" },
    { id: "p23", author: "Simone de Beauvoir", text: "Change your life today. Don't gamble on the future, act now, without delay.", tag: "Action" },
    { id: "p24", author: "Jean-Paul Sartre", text: "Hell is other people.", tag: "Society" },
    { id: "p25", author: "Hannah Arendt", text: "The most radical revolutionary will become a conservative the day after the revolution.", tag: "Power" },
    { id: "p26", author: "Immanuel Kant", text: "Science is organized knowledge. Wisdom is organized life.", tag: "Knowledge" },
    { id: "p27", author: "Blaise Pascal", text: "We know the truth, not only by the reason, but also by the heart.", tag: "Knowing" },
    { id: "p28", author: "Søren Kierkegaard", text: "The most common form of despair is not being who you are.", tag: "Authenticity" },
    { id: "p29", author: "Ralph Waldo Emerson", text: "For every minute you are angry you lose sixty seconds of happiness.", tag: "Perspective" },
    { id: "p30", author: "Henry David Thoreau", text: "Not until we are lost do we begin to understand ourselves.", tag: "Discovery" },
    { id: "p31", author: "Friedrich Nietzsche", text: "Whoever fights monsters should see to it that in the process he does not become a monster.", tag: "Morality" },
    { id: "p32", author: "Albert Camus", text: "Don't walk in front of me, I may not follow. Don't walk behind me, I may not lead. Walk beside me, and just be my friend.", tag: "Friendship" },
    { id: "p33", author: "Simone de Beauvoir", text: "Defending the truth is not something one does out of a sense of duty. It is a deep personal pleasure.", tag: "Truth" },
    { id: "p34", author: "Jean-Paul Sartre", text: "We are our choices.", tag: "Responsibility" },
    { id: "p35", author: "Hannah Arendt", text: "The world is not humane just because it is made by human beings.", tag: "Humanity" },
    { id: "p36", author: "Immanuel Kant", text: "Act only according to that maxim whereby you can, at the same time, will that it should become a universal law.", tag: "Ethics" },
    { id: "p37", author: "Blaise Pascal", text: "I would have written a shorter letter, but I did not have the time.", tag: "Brevity" },
    { id: "p38", author: "Søren Kierkegaard", text: "People demand freedom of speech as a compensation for the freedom of thought which they seldom use.", tag: "Thought" },
    { id: "p39", author: "Ralph Waldo Emerson", text: "The only person you are destined to become is the person you decide to be.", tag: "Agency" },
    { id: "p40", author: "Henry David Thoreau", text: "Things do not change; we change.", tag: "Self" },
    { id: "p41", author: "Friedrich Nietzsche", text: "There is always some madness in love. But there is also always some reason in madness.", tag: "Love" },
    { id: "p42", author: "Albert Camus", text: "I may not have been sure about what really did interest me, but I was absolutely sure about what didn't.", tag: "Clarity" },
    { id: "p43", author: "Simone de Beauvoir", text: "Life is occupied in both perpetuating itself and in surpassing itself. If all it does is maintain itself, then living is only not dying.", tag: "Transcendence" },
    { id: "p44", author: "Jean-Paul Sartre", text: "Every existing thing is born without reason, prolongs itself out of weakness, and dies by chance.", tag: "Existence" },
    { id: "p45", author: "Hannah Arendt", text: "Storytelling reveals meaning without committing the error of defining it.", tag: "Narrative" },
    { id: "p46", author: "Immanuel Kant", text: "Happiness is not an ideal of reason, but of imagination.", tag: "Imagination" },
    { id: "p47", author: "Blaise Pascal", text: "Man is but a reed, the most feeble thing in nature; but he is a thinking reed.", tag: "Consciousness" },
    { id: "p48", author: "Søren Kierkegaard", text: "To dare is to lose one's footing momentarily. Not to dare is to lose oneself.", tag: "Risk" },
    { id: "p49", author: "Ralph Waldo Emerson", text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", tag: "Originality" },
    { id: "p50", author: "Henry David Thoreau", text: "Our life is frittered away by detail. Simplify, simplify.", tag: "Simplicity" },
  ],
};

// ── Inline checkbox ───────────────────────────────────────

function RowCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={onToggle}
      className="relative w-[18px] h-[18px] shrink-0 appearance-none bg-transparent p-0 border-0 outline-none cursor-pointer"
    >
      <div
        className={`absolute inset-0 rounded-[5px] border-solid transition-all duration-80 ${
          checked
            ? "border-[1.5px] border-transparent"
            : "border-[1.5px] border-border"
        }`}
      />
      <AnimatePresence>
        {checked && (
          <CheckboxPrimitive.Indicator forceMount asChild>
            <motion.svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute inset-0 text-foreground"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
            >
              <motion.path
                d="M6 12L10 16L18 8"
                initial={{ pathLength: 0 }}
                animate={{
                  pathLength: 1,
                  transition: { duration: 0.08, ease: "easeOut" },
                }}
                exit={{
                  pathLength: 0,
                  transition: { duration: 0.04, ease: "easeIn" },
                }}
              />
            </motion.svg>
          </CheckboxPrimitive.Indicator>
        )}
      </AnimatePresence>
    </CheckboxPrimitive.Root>
  );
}

// ── Page ──────────────────────────────────────────────────

export default function TablePage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const toggleSaved = useCallback(
    (id: string) =>
      setSaved((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    []
  );

  const category = tabs[selectedTab].label;
  const rows = useMemo(() => quotes[category] ?? [], [category]);

  return (
    <div className="flex flex-col gap-6 px-10 py-10 w-full">
      <h1
        className="text-[22px] text-foreground px-2"
        style={{ fontVariationSettings: fontWeights.bold }}
      >
        Quotes
      </h1>

      <SubtleTab
        idPrefix="quotes"
        selectedIndex={selectedTab}
        onSelect={setSelectedTab}
      >
        {tabs.map((tab, i) => (
          <SubtleTabItem
            key={tab.label}
            index={i}
            icon={tab.icon}
            label={tab.label}
          />
        ))}
      </SubtleTab>

      {tabs.map((tab, i) => (
        <SubtleTabPanel
          key={tab.label}
          index={i}
          selectedIndex={selectedTab}
          idPrefix="quotes"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">Saved</TableHead>
                <TableHead className="w-[180px]">Author</TableHead>
                <TableHead>Quote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((q, idx) => (
                <TableRow key={q.id} index={idx}>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <RowCheckbox
                        checked={saved.has(q.id)}
                        onToggle={() => toggleSaved(q.id)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{q.author}</TableCell>
                  <TableCell>{q.text}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SubtleTabPanel>
      ))}
    </div>
  );
}
