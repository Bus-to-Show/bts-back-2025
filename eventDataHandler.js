const knex = require('./knex.js')

const sweepInCarts = () => {
  console.log('sweepInCarts fired')
  let twentyMinutesAgo = new Date(Date.now() - 1200000)
  console.log('twentyMinutesAgo', twentyMinutesAgo)
  let now = new Date(Date.now())
  console.log('now', now)


  knex('pickup_parties')
  .select('id', 'inCart', 'updated_at' )
  .where('updated_at', '<' , twentyMinutesAgo)
  .andWhereNot('inCart', '=', 0 )
  .update('inCart', 0)
   .update('updated_at', now)
  .returning('*')
  .then(result=>{console.log('sweepInCarts result', result)})
}

module.exports = {sweepInCarts}
