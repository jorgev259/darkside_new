const { log } = require('../../utilities.js')
module.exports = {
  commands: {
    softban: {
      desc: 'Ban an user by id',
      usage: '>softban [id]',
      execute (client, msg, param, db) {
        //
        if (!param[1]) return msg.channel.send('No id was provided')
        msg.guild.members.ban(param[1]).then(() => {
          msg.channel.send('Ban succesfull')
        }).catch(err => {
          console.log(err)
          log(client, err.message || err.stack)
          msg.channel.send('Something went wrong!')
        })
      }
    }
  }
}
