let lastID = {}

module.exports = {
  events: {
    async ready (client, db) {
      client.guilds.each(async guild => {
        let log = (await guild.fetchAuditLogs({ limit: 1, type: 72 })).entries.first()
        lastID[guild.id] = log.id
      })

      // client.channels.find(c => c.name === 'admin').send('Killer of wonder has restarted!')
    },

    async messageDelete (client, db, m) {
      let log = (await m.guild.fetchAuditLogs({
        limit: 1,
        type: 72
      })).entries.first()

      if (log.id !== lastID[m.guild.id]) {
        lastID[m.guild.id] = log.id
        let embed = {
          embed: {
            description: `${log.executor.tag} deleted a message from ${
              log.target.tag
            } on #${log.extra.channel.name}`,
            color: 13556890,
            fields: [
              {
                name: 'Deleted Message',
                value: m.content
              }
            ]
          }
        }

        if (m.attachments.size > 0) {
          embed.files = m.attachments.map(function (att) {
            return { name: att.file.name, attachment: att.proxyURL }
          })
        }
        if (embed.embed.fields[0].value) { m.guild.channels.find(c => c.name === 'admin-log').send(embed) }
      }
    }
  }
}
