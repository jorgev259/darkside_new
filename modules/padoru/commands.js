const moment = require('moment')
const chance = require('chance').Chance()
const { MessageEmbed } = require('discord.js')
const path = require('path')

let greetings = [
  '{user} just sent his redGuards to {sent}. And they brought a <:gjallardoodle:522816784580214804>!',
  '{user} sent a <:gjallardoodle:522816784580214804> to {sent}. Happy Dawning!',
  '{user} threw a snowball to {sent}. Why does it have a <:gjallardoodle:522816784580214804> on it...',
  '{user} left something on the postmaster for {sent}. Its a <:gjallardoodle:522816784580214804>!',
  "{user} Slayed the finest ingredients for your <:gjallardoodle:522816784580214804> {sent} You should be thrilled they didn't use you!",
  '{sent} just got 2 tokens and a <:gjallardoodle:522816784580214804> from {user}',
  '{user} Worked very hard on these <:gjallardoodle:522816784580214804> just for you. {sent} Treat them with the same kindness. No Burnt Edge Transits.',
  "{user} gifted you a <:gjallardoodle:522816784580214804>. Eva's are tastier though...",
  '{user} gifted you a <:gjallardoodle:522816784580214804>. Worthy of an Ahamkara wish!',
  '{user} has bent time and space, sacrificed blood and sinew to gift you with something to enjoy <:gjallardoodle:522816784580214804> {sent} They are quite the ally to keep close.',
  "{user} forged in the hot embers of a compact and portable oven, their deepest re(d)guards for your friendship. {sent} Please don't pelt them with another snowball...",
  '{JARF}: 011001100011100111 <:gjallardoodle:522816784580214804> {sent} 01010',
  '{user} Celebrate with <:gjallardoodle:522816784580214804> The only non-organic, yet organic treat for the Holidays. {sent} Side-effects may include: Spontaneous dancing, Yule-log throwing, Vex-Milk addiction, and many others that cannot be listed.',
  "{user} You don't have to be awoken to get some Shaxxy gifts <:gjallardoodle:522816784580214804> {sent} The helmet doesn't have to stay on either, make use of protection either way.",
  "{user} Once upon a time you received a gift. Likely it's because they'd rather you chew some <:gjallardoodle:522816784580214804> than to keep speaking. {sent} Eat as many as keeps you quiet.",
  "{user} Roses are red, Violets are Blue, it isn't Valentines yet, but you've got some <:gjallardoodle:522816784580214804> to chew. {sent} They go great with some Benedict and Jalal Ice Cream! Triple Kill Chillesto is my favorite!",
  "{user} Ladies, Gentlemen, Guardians of all ages. It's <:gjallardoodle:522816784580214804> back again, once again. {sent} And as always, stay frosting.",
  "{user} Baby it's cold outsi- :ERROR: Song not found. <:gjallardoodle:522816784580214804> will ease the pain. {sent} This is why we can't have nice things.",
  "{user} Dul Incaru may be a frigid Witch, but <:gjallardoodle:522816784580214804> will sate that loneliness itch. {sent} Yeah, we didn't use the word with a B.",
  '{user} The Drifter may have a Gambit for you to enjoy, but your friends got a tastier ploy. <:gjallardoodle:522816784580214804> {sent} Feast and enjoy!',
  '{user} Deadpool will change your name, and Storm may ban you from the server again...but Chito made our bot, the cookie delivery lot.* {sent} Cookies are digital and are not actually edible, please do not lick your screens.*'
]

module.exports = {
  reqs (client, db) {
    return new Promise((resolve, reject) => {
      db.prepare(
        'CREATE TABLE IF NOT EXISTS greetingsSent (id TEXT, count INT DEFAULT 0, lastTime DATETIME DEFAULT NULL, PRIMARY KEY(id))'
      ).run()
      db.prepare(
        'CREATE TABLE IF NOT EXISTS greetingsReceived (id TEXT, count INT DEFAULT 0, PRIMARY KEY(id))'
      ).run()
      resolve()
    })
  },

  commands: {
    send: {
      desc: 'Send Gjallardoodles to someone else!',
      usage: '>send @user',
      execute (client, msg, param, db) {
        if (moment().month() !== 11) return msg.channel.send('The dawning has gone by. The oven fire is down until further notice')
        if (msg.mentions.members.size === 0) {
          return msg.channel.send(
            'You need to mention who you want to send Gjllardoodles to!'
          )
        }
        if (msg.mentions.members.size > 1) {
          return msg.channel.send('You can only gift one person at a time!')
        }
        let sendId = msg.mentions.members.first().id
        if (msg.author.id === sendId) {
          return msg.channel.send(
            "Gjllardoodles are meant to be shared! That's the Dawning spirit"
          )
        }
        if (sendId === msg.guild.me.id) {
          return msg.channel.send(
            `${msg.guild.me}: 011001100011100111 cant compute`
          )
        }
        check(db, msg.author.id)
        check(db, sendId)

        let { lastTime } = db
          .prepare('SELECT lastTime from greetingsSent WHERE id=?')
          .get(msg.author.id)
        let momentRefresh = moment(lastTime)
        momentRefresh.add(1, 'hours')

        if (lastTime === null || moment().isAfter(momentRefresh)) {
          db.prepare(
            'UPDATE greetingsReceived SET count=count+1 WHERE id=?'
          ).run(sendId)
          db.prepare(
            'UPDATE greetingsSent SET count=count+1, lastTime=? WHERE id=?'
          ).run(moment().format('YYYY-MM-DD HH:mm:ss'), msg.author.id)

          msg.channel.send(
            greetings[(Math.random() * greetings.length) >> 0]
              .replace('{user}', msg.author)
              .replace('{sent}', `<@${sendId}>`)
              .replace('{JARF}', msg.guild.me)
          )

          if (chance.bool({ likelihood: 5 })) {
            let ammount = chance.integer({ min: 1, max: 10 })
            msg.channel.send(
              `<@${sendId}> a Loremaster appears in front of you after taking a bite of the <:gjallardoodle:522816784580214804>. The loremaster says "Stay Frosty" as he hands ${ammount} <:gjallardoodle:522816784580214804> to you and ${
                msg.author
              } and allows ${msg.author} to make another gift.`,
              { files: [path.join(__dirname, 'resources/MagicJoker.jpg')] }
            )
            db.prepare(
              'UPDATE greetingsReceived SET count=count+? WHERE id=?'
            ).run(ammount, sendId)
            db.prepare(
              'UPDATE greetingsReceived SET count=count+? WHERE id=?'
            ).run(ammount, msg.author.id)
            db.prepare('UPDATE greetingsSent SET lastTime=? WHERE id=?').run(
              null,
              msg.author.id
            )
          }
        } else {
          msg.channel.send(
            `You can send more Gjllardoodles <:gjallardoodle:522816784580214804> ${moment().to(
              momentRefresh
            )}`
          )
        }
      }
    },
    doodles: {
      desc: "Check how many Gjllardoodles you've received and sent",
      usage: '>doodles',
      execute (client, msg, param, db) {
        check(db, msg.author.id)
        let info = db
          .prepare(
            `
        SELECT sentRank, receivedRank, sent.count as sent, received.count as received FROM (
          SELECT s1.id, s1.count, COUNT(DISTINCT s2.count) AS receivedRank
          FROM greetingsReceived s1 JOIN greetingsReceived s2 ON (s1.count <= s2.count)
          GROUP BY s1.id
        ) o1,
        (
          SELECT s1.id, s1.count, COUNT(DISTINCT s2.count) AS sentRank
              FROM greetingsSent s1 JOIN greetingsSent s2 ON (s1.count <= s2.count)
              GROUP BY s1.id
        ) o2,
        greetingsReceived received,
        greetingsSent sent
        WHERE o1.id = o2.id
        AND o1.id=received.id
        AND o1.id=sent.id
        AND o1.id = ?`
          )
          .get(msg.author.id)

        let embed = new MessageEmbed()
          .setAuthor(msg.author.tag, msg.author.avatarURL())
          .attachFiles([
            {
              name: 'doodle.jpg',
              attachment: path.join(__dirname, 'resources/doodle.jpg')
            }
          ])
          .setThumbnail('attachment://doodle.jpg')
          .setColor('RED')
          .addField(
            'Gjallardoodles Received:',
            `${info.received} (#${info.receivedRank})`
          )
          .addField('Gjallardoodles Sent:', `${info.sent} (#${info.sentRank})`)

        msg.channel.send(embed)
      }
    }
  }
}

function check (db, id) {
  if (
    db.prepare('SELECT id FROM greetingsSent WHERE id=?').get(id) === undefined
  ) {
    db.prepare('INSERT INTO greetingsSent (id) VALUES (?)').run(id)
  }
  if (
    db.prepare('SELECT id FROM greetingsReceived WHERE id=?').get(id) ===
    undefined
  ) {
    db.prepare('INSERT INTO greetingsReceived (id) VALUES (?)').run(id)
  }
}
