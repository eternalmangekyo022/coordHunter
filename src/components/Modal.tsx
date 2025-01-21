import { useAtom } from 'jotai'
import { modalOpenAtom } from '../store/atoms'
import './styles/modal.scss'
import { useState } from 'react'

export default function Modal() {
	const [modal, setModal] = useAtom(modalOpenAtom)
	const [out, setOut] = useState(false);

	function disableModal() {
		setOut(true)
		setModal(false)
		setTimeout(() => setOut(false), 300)
	}

	return <div className={`modal${modal ? ' active': ''}${out ? ' out': ''}`} onClick={disableModal}>
		<div className="card">

		</div>
	</div>
}