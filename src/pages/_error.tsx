function Error({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>{statusCode || 'Error'}</h1>
      <p>{statusCode ? `An error ${statusCode} occurred` : 'An error occurred'}</p>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: { res?: { statusCode?: number }, err?: { statusCode?: number } }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
