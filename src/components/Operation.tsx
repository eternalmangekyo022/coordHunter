import { useState } from "react"

type PropTypes = { name: string, id: number, onClick: (active: boolean) => void }

export default function Operation({ name, id, onClick }: PropTypes) {
	const [active, setActive] = useState(false)

	return <button className={`operation-btn${active ? ' active' : ''}`} key={id} onClick={() => {
		setActive(prev => {
			onClick(!prev)
			return !prev
		})
	}}>{name}</button>
}