let pendingTransition = null

export const NAVIGATION_TRANSITION = {
  BACK: 'ios-back',
  FORWARD: 'ios-forward',
  NONE: 'ios-none',
}

export const markNextTransitionBack = () => {
  pendingTransition = NAVIGATION_TRANSITION.BACK
}

export const consumeNextTransition = () => {
  const transition = pendingTransition
  pendingTransition = null
  return transition
}

export const goBackWithTransition = (router, fallback) => {
  markNextTransitionBack()

  if (window.history.state?.back) {
    router.back()
    return true
  }

  if (fallback !== undefined) {
    router.replace(fallback)
    return true
  }

  router.back()
  return false
}
