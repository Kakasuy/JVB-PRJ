import { redirect } from 'next/navigation'

const Page = () => {
  return redirect('/authors/current-user')
}

export default Page