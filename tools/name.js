import { Random } from 'meteor/random'
import { kebabCase, deburr } from 'lodash'

const safeName = name => {
  const nameParts = name.split('.')
  const extension = nameParts.pop()
  const fileName = nameParts.join('.')
  return kebabCase(deburr(fileName)) + '-' + Random.id(5) + '.' + extension
}

export { safeName }
