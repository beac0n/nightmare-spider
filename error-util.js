module.exports = {
    isTimeout: (error) => error.code === -7,
    isAborted: (error) => error.details !== 'ERR_ABORTED'
}