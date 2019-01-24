let { stream } = require('./util.js')
let reactions = ['✅', '❎', '❓']

module.exports = {
  reqs (client, db) {
    return new Promise((resolve, reject) => {
      db.prepare(
        'CREATE TABLE IF NOT EXISTS twitter (id TEXT, channel TEXT, PRIMARY KEY (id,channel))'
      ).run()
      db.prepare(
        'CREATE TABLE IF NOT EXISTS tweets (id TEXT, url TEXT, channel TEXT, PRIMARY KEY (id))'
      ).run()
      client.channels
        .find(c => c.name === 'tweet-approval')
        .send(`Twitter service enabled`)
      resolve()
    })
  },
  events: {
    async ready (client, db) {
      let ids = db
        .prepare('SELECT id FROM twitter')
        .all()
        .map(r => r.id)

      await client.channels
        .find(c => c.name === 'tweet-approval')
        .messages.fetch()
      if (ids.length > 0) stream(client, db, ids)
    },

    async messageReactionAdd (client, db, reaction, user) {
      if (
        reaction.message.channel.name === 'tweet-approval' &&
        !user.bot &&
        reactions.includes(reaction.emoji.name)
      ) {
        let embed = reaction.message.embeds[0]

        switch (reaction.emoji.name) {
          case '✅':
            embed.setFooter(`Accepted by ${user}`)
            let url = ''
            let msgs = db
              .prepare('SELECT channel,url FROM tweets WHERE id=?')
              .all(reaction.message.id)
              .map(row => {
                return client.channels
                  .find(c => c.name === row.channel)
                  .send({ content: `<${row.url}>`, files: [`temp/${row.url.split('/').slice(-2)[0]}.png`] })
              })

            Promise.all(msgs).catch(err => {
              console.log(err)
              client.channels
                .find(c => c.name === 'tweet-approval-log')
                .send(`A message couldnt be send in some channels. URL: ${url}`)
            })

            sendLog(client, db, reaction, embed, 'tweet-approval-log')
            break

          case '❎':
            embed.setFooter(`Rejected by ${user}`)
            sendLog(client, db, reaction, embed, 'tweet-approval-log')
            break

          case '❓':
            let question = await reaction.message.channel.send(
              `${user} type (or mention) the name of the channel where you want to send the tweet.`
            )
            const filter = m =>
              m.mentions.channels.size > 0 ||
              reaction.message.guild.channels.some(c => c.name === m.content)
            reaction.message.channel
              .awaitMessages(filter, { max: 1 })
              .then(collected => {
                let channel
                if (collected.first().mentions.channels.size > 0) { channel = collected.first().mentions.channels.first() } else {
                  channel = reaction.message.guild.channels.find(
                    c => c.name === collected.first().content
                  )
                }

                embed.setFooter(`Accepted by ${user}`)

                let url = db
                  .prepare('SELECT channel,url FROM tweets WHERE id=?')
                  .all(reaction.message.id)[0].url
                channel.send(url).catch(err => {
                  console.log(err)
                  client.channels
                    .find(c => c.name === 'tweet-approval-log')
                    .send(
                      `A message couldnt be send in some channels. URL: ${url}`
                    )
                })

                sendLog(client, db, reaction, embed, 'tweet-approval-log')
                question.delete()
                collected.first().delete()
              })
            break
        }
      }
    }
  }
}

function sendLog (client, db, reaction, embed, channelName) {
  db.prepare('DELETE FROM tweets WHERE id=?').run(reaction.message.id)

  embed.setTimestamp()
  client.channels.find(c => c.name === channelName).send(embed)
  reaction.message.delete()
}
