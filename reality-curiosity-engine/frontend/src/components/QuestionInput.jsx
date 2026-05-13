export default function QuestionInput({ value, onChange, onSubmit, loading }) {
  return (
    <section className="panel question-input">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && onSubmit()}
        placeholder="Ask a big question: What is time? What is consciousness?"
      />
      <button onClick={onSubmit} disabled={loading || !value.trim()}>
        {loading ? 'Expanding Universe...' : 'Generate Universe'}
      </button>
    </section>
  )
}
