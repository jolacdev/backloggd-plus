---
name: word-counter-demo
description: Use this skill when the user asks to count words, count characters, or analyze the length of a sentence or paragraph.
user-invocable: true
disable-model-invocation: false
---

# Word Counter Skill

## Purpose

This skill counts words and characters in user-provided text.

## When to use

Use this skill when the user:

- asks "how many words"
- asks "count words"
- asks "length of this text"
- asks for character count

## Instructions

1. Extract the text from the user request.
2. Count:
   - number of words (split by spaces)
   - number of characters (including spaces)
3. Return a clear structured response.

## Word Analysis

```
Text: <text>
Words: <number>
Characters: <number>
```
