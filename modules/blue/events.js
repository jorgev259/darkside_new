const path = require('path')
module.exports = {
  config: {
    default: true
  },
  async ready (client, db) {
    let guild = client.guilds.first()
    guild.setName('Blueside Treachery Lore')
    guild.setIcon(path.join(__dirname, 'resources/pfp.jpg'))
    guild.channels.find(c => c.name === 'general').send(
      '@everyone',
      { files: [path.join(__dirname, 'resources/lived.png')] }
    )
  }
}
