import { useAtom } from 'jotai'
import { modalOpenAtom } from '../store/atoms'
import './styles/modal.scss'
import Operation from './Operation'
import { useEffect, useState } from 'react'
import axios from 'axios'

type Props = {
	loadOperation: (op: Operations, city: ApiCity, payload: string) => Promise<void>,
	apis: ApiCityMap | undefined
}

interface IQuest { 
	name?: string
}

interface IRocket {
	id?: string
}

export default function Modal({ loadOperation, apis }: Props) {
	const [modal, setModal] = useAtom(modalOpenAtom)
	const [selectedUrl, setSelectedUrl] = useState<ApiCity>('nyc');
	const [selectedOperation, setSelectedOperation] = useState<Operations>('quests');
	const [quests, setQuests] = useState<IQuest>({});
	const [rockets, setRockets] = useState<IRocket>({});
	const [selectedQuests, setSelectedQuests] = useState<number[]>([]);

	const [out, setOut] = useState(false);

	function closeModal() {
		setOut(true)
		setModal(false)
		setTimeout(() => setOut(false), 300)
	}

	useEffect(() => {
		async function loadAssets() {
			const questsUrl = 'https://nyc-backend.vercel.app/quests';
			const { data: quests } = await axios.get<IQuest>(questsUrl)
			setQuests(quests)

			const rocketsUrl = 'https://nyc-backend.vercel.app/rockets';
			const { data: rockets } = await axios.get<IRocket>(rocketsUrl);
			setRockets(rockets)
		}
		loadAssets()
	}, [])

	return <div className={`modal${modal ? ' active': ''}${out ? ' out': ''}`}>
		<div className="card">
			<div className="card-head">
				<select name="selectedApi" id="selectedApi" onChange={e => setSelectedUrl(e.target.value as ApiCity)}>
					{Object.entries(apis || {}).map(([k,{ name }]) => <option key={k} value={k}>{name}</option>)}
				</select>
				<select name="selectedOperation" id="selectedOperation" onChange={e => setSelectedOperation(e.target.value as Operations)}>
					<option value="quests">Quest</option>
					<option value="rockets">Rocket</option>
				</select>
			</div>
			<div className="card-body">
				{selectedOperation === 'quests' ? 
				Object.entries(quests).map(([v,k]) => <Operation name={v} id={k} onClick={(active) => setSelectedQuests(prev => active ? [...prev, k] : prev.filter(id => id !== k))}	/>): 
				Object.entries(rockets).map(([v,k]) => <Operation name={v} id={k} onClick={(active) => setSelectedQuests(prev => active ? [...prev, k] : prev.filter(id => id !== k))}/>)}
			</div>
			<div className="card-footer">
				<button id='close-btn' onClick={closeModal}>Close</button>
				<button id='load-btn' onClick={() => {
					loadOperation(selectedOperation, selectedUrl, selectedQuests.join(','))
					closeModal()
				}}>Load</button>
			</div>
		</div>
	</div>
}