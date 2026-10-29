<div align="center">
  <img height="80" width="80" src="https://github.com/user-attachments/assets/8db76194-6ee3-47a2-b798-7bb79afb66ff">
  <h1>Code Assignment @ Toca Boca</h1>
  <img src="https://img.shields.io/badge/type-backend-FF7040">
  <img src="https://img.shields.io/badge/language-TypeScript-59ACFF">
  <img src="https://img.shields.io/badge/concepts-REST APIs & databases-62D962">
  <img src="https://img.shields.io/badge/est. duration-max 8 hours-FF8CBC">
  <br/><br/>
</div>

At Toca Boca, our mission is to create a playful environment where children can play and evolve in a
safe space. Our goal with this assignment is to evaluate your ability to write good quality code in
a practical exercise.

After the assignment has been submitted you will be invited to
[a follow-up interview](#the-follow-up-interview) with developers from Toca Boca.

<details><summary><b>Table of contents</b></summary>

- [The task: a simplified game packs API](#the-task-a-simplified-game-packs-api)
  - [Requirements](#requirements)
    - [API](#api)
    - [Database](#database)
    - [Tests](#tests)
    - [Code style](#code-style)
    - [Environment and infrastructure](#environment-and-infrastructure)
  - [Documentation](#documentation)
- [Technologies and tools](#technologies-and-tools)
  - [What we use at Toca Boca](#what-we-use-at-toca-boca)
- [The follow-up interview](#the-follow-up-interview)
- [Checklist](#checklist)

</details>

## The task: a simplified game packs API

In [Toca Boca World](https://tocaboca.com/toca-boca-world), users may purchase packs that add content to
their game. The packs can contain new locations, new characters, and a plethora of other fun and
exciting things. A pack may also contain other packs, where if you buy the parent pack you also
receive the sub packs.
[Click here to see an example trailer for a pack!](https://www.youtube.com/watch?v=fcjn48_4AZA)

In this assignment we want you to **create a simplified REST API for game packs** that are **stored
in a database**. It is not expected to take more than 8 hours, so only take the time you feel you need!

### Requirements

#### API

The API should be **written in TypeScript** and at least have the following endpoints:

- `POST localhost:8080/packs` - Saves a pack to the database.
- `GET localhost:8080/packs` - Returns all packs that are in the database.
- `GET localhost:8080/packs/:id/content` - Returns a flat, unique list of all `content` a pack
  contains, _including the contents of its child packs_.

##### The `pack` entity

A pack object returned via the API should contain the pack ID, pack name, child pack IDs and an active flag. You may add additional information. The response could look something like this:

```json
{
  "id": "pack.school",
  "packName": "The School Pack",
  "active": true,
  "price": 10,
  "content": ["furniture.whiteboard"],
  "childPackIds": ["pack.classroom", "pack.playground"]
}
```

#### Database

The packs should be saved in an appropriate database.

You are free to use whatever database you want, and structure it in a way you think works best for
the task.

#### Tests

Please include tests for you code, similar to how you would test a service running in production.

#### Code style

Feel free to use whatever code style, lint rules, or conventions that you prefer. Just remember that
the code should be easy for the reviewer to read and understand.

#### Environment and infrastructure

The `docker-compose.yml` should be configured so that both the service and the database can be
started with a single `docker compose -up` command. It should not require the reviewer to
configure anything else on their side (e.g. environment variables).

The service and database should only run locally and not interact with any remote sources.

### Documentation

The code should be documented enough so that the reviewer can understand it and try it out.

The readme should at least include:

- Setup instructions (how to install and run the project).
- Usage instructions (how to query the endpoints).
- Any extra information that might be good for the reviewer to know.

## Technologies and tools

The only requirement is that the code is written in TypeScript, other than that you are free to use
any frameworks, libraries, or tools that you might need.

### AI

You are allowed to use AI tools to assist in the development process, whether it's for code generation, documentation, or testing. However, if you decide to use AI tools, please make sure to document their usage clearly in your submission, including:

- The specific AI tools used.
- The purpose for which each AI tool was used.
- The complete history of your AI prompts.

### What we use at Toca Boca

Here are some examples of relevant technologies that we use at Toca Boca:

- **Service**: [Node](https://nodejs.org/), [NestJS](https://nestjs.com/)
- **Databases**: [PostgresQL](https://www.postgresql.org/),
  [DynamoDB](https://aws.amazon.com/dynamodb/)
- **Testing**: [Jest](https://jestjs.io/), [Vitest](https://vitest.dev/)

If you are familiar with any of these, or just unsure what to pick yourself, please use them for the
assignment! That said, stick with what you're comfortable with - it is not a requirement to use
them.

## The follow-up interview

After you have submitted your code you will be invited to a follow-up interview with developers from
Toca Boca.

During this interview we will discuss your code, such as your choice of technologies and how you
implemented the API. The goal is to use the assignment as a base for discussion, _not_ to punch
holes in it or look for gotchas and flaws.

**Depending on the role, we might ask questions like:**

- _Explain your reasoning around the project, how did you go about starting it and were there any problems?_
- _Why did you choose the tools that you did?_
- _Is there anything you would like to improve, like code choices, tools used etc?_
- _Is there anything missing in this service? What would be the next step if you had more time?_

## Checklist

That was a lot of information! To help you ensure that you've included everything, here's a quick
checklist.

**My submission**:

- [ ] Is written in TypeScript.
- [ ] Includes all [expected endpoints](#api).
- [ ] Has [sufficient tests](#tests) that are passing.
- [ ] Has [sufficient documentation](#documentation).
- [ ] Can be [started with a single `docker compose -up`](#environment-and-infrastructure) command.
