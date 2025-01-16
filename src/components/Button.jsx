export default function Button({ onClick, href }) {
	return (
		<a className='next-btn' target='_blank' object='link-editable' href={href} onClick={onClick}>Next</a>
	)
}