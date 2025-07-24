import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css";


export const AppContext = createContext()

export const AppContextProvider = (props) => {

    axios.defaults.withCredentials = true;

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [isLoggedin, setIsLoggedin] = useState(false)
    const [userData, setUserData] = useState(false)

    // get auth/state it will check the authetication status weather the user is authenticate are not

    const getAuthState = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/auth/is-auth')
            if (data.success) {
                setIsLoggedin(true)
                getUserData()
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // getting user data

    const getUserData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/data')
            data.success ? setUserData(data.userData) : toast.error(data.message)
        } catch (error) {
            toast.error(error.message)
        }
    }

    //getAuthState we will call the funtion when the web page is loaded for that we are usig useEffect()

    useEffect(() => {
        getAuthState();
    }, [])


    const value = {
        backendUrl,
        isLoggedin, setIsLoggedin,
        userData, setUserData,
        getUserData
    }

    return (
        < AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}



