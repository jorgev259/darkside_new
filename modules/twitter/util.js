const Twitter = require('twit')({
  consumer_key: 'dNRsXzACONSW07UdJQ7Pjdkc6',
  consumer_secret: 'KD0SDdbzb7OrYNCgjJfUWo66dpSgLd8WCrn4fffaPYwo0wig6d',
  access_token: '858864621893058560-KImtTaWcQDMPkhKE6diK6QUQJOIeCt9',
  access_token_secret: 'pBkS7T83E4924krvkigXcHvk2dvitbCq6f2l6BzyDCeOH'
})
let streams = {}
const { log } = require('../../utilities.js')
const { MessageEmbed } = require('discord.js')
const { loadImage, createCanvas } = require('canvas')

module.exports = {
  streams: streams,
  twitter: Twitter,
  stream (client, db, ids) {
    if (Object.keys(streams).some(r => ids.includes(r))) return
    var stream = Twitter.stream('statuses/filter', { follow: ids })
    ids.forEach(id => { streams[id] = stream })

    stream.on('tweet', async function (tweet) {
      if (Object.keys(streams).includes(tweet.user.id_str) || tweet.retweeted) {
        let twit = tweet
        console.log(twit)
        if (tweet.retweeted_status) twit = tweet.retweeted_status

        let embed = new MessageEmbed()
          .setAuthor(`${twit.user.name} | ${twit.user.screen_name}`, twit.user.profile_image_url)
          .setThumbnail()
          .setColor(twit.user.profile_background_color)
          .setTimestamp()

        let url = `https://twitter.com/${twit.user.screen_name}/status/${twit.id_str}/`

        let sendText = ''
        if (twit.quoted_status) sendText += twit.quoted_status_permalink.expanded

        sendText += ` ${url}`

        if (twit.quoted_status) embed.addField('Quoted Tweet', twit.quoted_status.text.split(' ').slice(0, -1).join(' '))
        if (twit.extended_tweet) embed.addField('Tweet', twit.extended_tweet.full_text.split(' ').slice(0, -1).join(' '))
        else embed.addField('Tweet', twit.text)
        embed.addBlankField()

        if (twit.quoted_status) embed.addField('Quoted Tweet URL', twit.quoted_status_permalink.expanded)
        embed.addField('URL', url)
        embed.addBlankField()

        embed.addField('Channel', 'Test channel')

        if (tweet.retweeted_status) embed.addField('Retweeted by', tweet.user.screen_name)

        if (twit.extended_entities && twit.extended_entities.media) {
          let media = twit.extended_entities.media.filter(e => e.type === 'photo').map(e => loadImage(e.media_url))
          let array = await Promise.all(media)
          let widthTotal = 0
          let x = 0

          array.sort((a, b) => {
            return a.height > b.height ? -1 : b.height > a.height ? 1 : 0
          })

          array.forEach(e => { widthTotal += e.width })
          if (array[0] !== undefined) {
            const canvas = createCanvas(widthTotal, array[0].height)
            let ctx = canvas.getContext('2d')

            array.forEach(e => {
              ctx.drawImage(e, x, 0)
              x += e.width
            })

            embed.attachFiles([{ name: 'images.png', attachment: canvas.toBuffer() }])
              .setImage('attachment://images.png')
          }
        }

        let stmt = db.prepare('SELECT channel,auto,id FROM twitter WHERE id=?')

        for (const row of stmt.iterate(tweet.user.id_str)) {
          switch (row.channel) {
            case 'false':
              embed.fields[embed.fields.findIndex(item => item.name === 'Channel')].value = `#${row.channel}`

              client.channels.find(c => c.name === 'tweet-approval').send(embed).then(m => {
                m.react('✅').then(() => {
                  m.react('❎').then(() => {
                    m.react('❓').then(() => {
                      db.prepare('INSERT INTO tweets (id,url,channel) VALUES (?,?,?)').run(m.id, sendText, row.channel)
                    })
                  })
                })
              })
              break

            case 'true':
              approveTweet('auto', row.id, client, embed, client.user, db)
              break
          }
        }
      }
    })
    stream.on('error', function (err) {
      log(client, err.message)
    })
  },

  approveTweet: approveTweet,
  sendLog: sendLog
}

function sendLog (client, db, reaction, embed, channelName) {
  db.prepare('DELETE FROM tweets WHERE id=?').run(reaction.message.id)

  embed.setTimestamp()
  client.channels.find(c => c.name === channelName).send(embed)
  reaction.message.delete()
}

function approveTweet (type, id, client, embed, user, db) {
  embed.setFooter(`Accepted by ${user}`)
  let url = ''
  if (type === 'message') {
    let msgs = db
      .prepare('SELECT channel,url FROM tweets WHERE id=?')
      .all(id)
      .map(row => {
        url = row.url
        return client.channels
          .find(c => c.name === row.channel)
          .send(row.url)
      })

    Promise.all(msgs).catch(err => {
      console.log(err)
      client.channels
        .find(c => c.name === 'tweet-approval-log')
        .send(`A message couldnt be send in some channels. URL: ${url}`)
    })
  } else {
    let msgs2 = db
      .prepare('SELECT channel,url FROM twitter WHERE auto="true" AND id=?')
      .all(reaction.message.id)
      .map(row => {
        url = row.url
        return client.channels
          .find(c => c.name === row.channel)
          .send(row.url)
      })
  }

  sendLog(client, db, reaction, embed, 'tweet-approval-log')
}
