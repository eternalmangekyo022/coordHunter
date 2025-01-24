import { useState } from "react"

type PropTypes = { name: string, id: number, onClick: (active: boolean) => void }

export default function Operation({ name, id, onClick }: PropTypes) {
	const [active, setActive] = useState(false)

	return <button key={id.toString()} className={`operation-btn${active ? ' active' : ''}`} onClick={() => {
		setActive(prev => {
			onClick(!prev)
			return !prev
		})
	}}><img height='95%' src={`https://projectpokemon.org/images/normal-sprite/${name}.gif`}/></button>
}