import * as React from 'react'
import { useState, useContext, useEffect, useCallback } from 'react'
import TradingBox from './TradingBox/index'
import { basePyroPair, filterPredicate } from './PyroTokens/index'
import Sisyphus from './Sisyphus/index'
import LiquidityMining from './LiquidityMining/index'
import ScarcityFaucet from './ScarcityFaucet/index'
import { Chip, Grid, Typography, Button, Link } from '@material-ui/core'
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { WalletContext } from "../../Contexts/WalletStatusContext"
import tokenListJSON from "../../../blockchain/behodlerUI/baseTokens.json"
import API from '../../../blockchain/ethereumAPI'
import { PyroToken } from 'src/blockchain/contractInterfaces/behodler/hephaestus/PyroToken'
import behodlerLogo from '../../../images/behodler/logo.png'
import eyelogo from '../../../images/behodler/landingPage/EyeLogo.png'
import liquidity from '../../../images/liquidBackground.png'
import blueGrey from '@material-ui/core/colors/blueGrey'
import TopMenu from 'src/components/LayoutFrame/TopMenu'
import Governance from '../Swap/Governance/index'

export type permittedRoutes = 'swap' | 'liquidity' | 'sisyphus' | 'faucet' | 'behodler/admin' | 'governance'

interface props {
    connected: boolean
    route: permittedRoutes
    setRouteValue: (v: permittedRoutes) => void
    setShowMetamaskInstallPopup: (v: boolean) => void
}

const useStyles = makeStyles(theme => createStyles({
    SwapRoot: {
        flexGrow: 1,
        margin: 0,
        marginTop: -100,
        paddingTop: 150,
        backgroundImage: `url("${liquidity}")`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        width: '100% !important'
    },
    SwapRootNotConnected: {
        flexGrow: 1,
        margin: 0,
        width: '100% !important'
    },
    tabs: {
        marginBottom: '20px'
    },
    betaRisk: {
        backgroundColor: "rgba(63, 81, 181, 0.8)",
        color: 'rgba(255,240,255,0.8)',
        marginBottom: '20px'

    }, Paper: {
        margin: "50px",
        maxWidth: "1000px",
        padding: "20px",
        backgroundColor: blueGrey['600'],
    },
    traderContainer: {
        margin: "50px",
        maxWidth: "1000px",
        padding: "20px",
        backgroundColor: 'rgba(255,255,255,0.93)',
        borderRadius: 20,
        height: '100%',
        minHeight:390,
        boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)'
    },
    Grid: {
        minHeight: "700px",
        with: "100%",

    },
    divider: {
        marginBottom: "20px"
    },
    image: {
        height: "250px"
    },
    behodlerHeading: {
        color: 'black',
        fontWeight: 'bold'
    },
    behodlerSubheading: {
        color: 'navy',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        fontStyle: 'italic'
    },
    link: {
        fontStyle: "italic"
    },
    connectButton: {
        margin: "20px 0 0 0"
    },
    warningText: {
        color: 'black',
        fontStyle: 'italic',
        maxWidth: 700,
        textAlign: 'center',
        textOverflow: 'wrap'
    },
    alphadrop: {
        color: 'black',
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.h6.fontSize || '1.25rem'
    },
    alphadropLink: {
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.h6.fontSize || '1.25rem'
    }
}));

export default function Swap(props: props) {
    const walletContextProps = useContext(WalletContext)

    const [pyroTokenMapping, setPyroTokenMapping] = useState<basePyroPair[]>([])
    const tokenList: any[] = props.connected ? tokenListJSON[walletContextProps.networkName].filter(filterPredicate) : []
    const primaryOptions = { from: walletContextProps.account }

    const fetchPyroTokenDetails = async (baseToken: string): Promise<basePyroPair> => {
        const pyroAddress = await walletContextProps.contracts.behodler.PyroTokenRegistry.baseTokenMapping(baseToken).call(primaryOptions)
        const token: PyroToken = await API.getPyroToken(pyroAddress, walletContextProps.networkName)
        const name = await token.name().call(primaryOptions)
        return {
            name,
            base: baseToken,
            pyro: pyroAddress
        }
    }

    const pytoTokenPopulator = useCallback(async () => {
        let mapping: basePyroPair[] = []
        for (let i = 0; i < tokenList.length; i++) {
            mapping.push(await fetchPyroTokenDetails(tokenList[i].address))
        }
        setPyroTokenMapping(mapping)
    }, [walletContextProps.networkName])

    useEffect(() => {
        if (props.connected) {
            pytoTokenPopulator()
        }
    }, [props.connected])

    const classes = useStyles();
    const [showChip, setShowChip] = useState<boolean>(false)

    useEffect(() => {
        const lastHide = localStorage.getItem('lastBehodlerHide')
        if (lastHide) {
            const duration = parseInt(lastHide)
            const elapsed = new Date().getTime() - duration
            setShowChip(elapsed > 604800000)//604800000 = 1 week
        } else
            setShowChip(true)
    }, [showChip])


    const hideChip = () => {
        localStorage.setItem('lastBehodlerHide', new Date().getTime().toString())
        setShowChip(false);
    }
    const logoVisible = !props.connected
    return <div>
        {logoVisible ? '' : <TopMenu setRouteValue={props.setRouteValue} />}
        <Grid
            container
            direction="column"
            justify="center"
            alignItems="center"
            spacing={6}
            className={props.connected ? classes.SwapRoot : classes.SwapRootNotConnected}>
            {showChip && props.connected ? <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
            ><Grid item>
                </Grid>
                <Grid item>
                    <Chip className={classes.betaRisk} label="Behodler is currently in Beta. Use at your own risk." onDelete={hideChip} variant="outlined" />
                </Grid>
            </Grid> : ""}
            {logoVisible ?
                <Grid item>
                    <img src={eyelogo} />
                </Grid>
                : ''}
            {logoVisible ? <Grid item>
                <Button className={classes.connectButton} color="primary" variant="outlined" onClick={async () => {
                    walletContextProps.isMetamask ? walletContextProps.connectAction.action() : props.setShowMetamaskInstallPopup(true)
                }}>Connect Your Wallet</Button>
            </Grid> : ''}
            {logoVisible ?
                <Grid item>
                    <Typography className={classes.warningText} variant='subtitle2'>
                        Connecting your wallet will banish the Behodler monster and launch our beta token bonding curve powered Liquidity Protocol.
                        Use at your own risk. The Behodler sees all prices. The Behodler HODLS all tokens.
            </Typography>
                </Grid>
                : ''}
            {logoVisible ? <Grid item>
                <img src={behodlerLogo} width="500" />
            </Grid> : ''}
            <Grid item>
                {logoVisible ? '' :
                    <Grid
                        container
                        direction="row"
                        justify="center"
                        alignItems="center"
                    >
                        <Grid item>
                            <Typography variant="h4" className={classes.behodlerHeading}>
                                Behodler Liquidity Protocol
            </Typography>
                        </Grid>
                    </Grid>
                }
            </Grid>
            {props.connected ? <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
            >
                <Grid item>
                    <div className={classes.alphadrop}>
                        Full details of the $EYE <Link component="button" className={classes.alphadropLink} onClick={() => window.open('https://medium.com/weidaithriftcoin/the-behodler-launch-in-partnership-with-degen-vc-bd865c1443a4', '_blank')}>alphadrop!</Link>
                    </div>
                </Grid>
            </Grid>
                : ''}
            {props.connected ?
                <Grid item>

                    <div className={classes.traderContainer}>
                        <Grid
                            container
                            direction="column"
                            justify="space-between"
                            alignItems="center"
                            spacing={3}
                        >
                            <Grid item>
                                <RenderScreen value={props.route} tokens={pyroTokenMapping} />
                            </Grid>
                        </Grid>
                    </div>
                </Grid>
                : ""}
        </Grid>
    </div>
}

function RenderScreen(props: { value: permittedRoutes, tokens: basePyroPair[] }) {
    switch (props.value) {
        case 'swap':
            return <TradingBox />
        case 'liquidity':
            return <LiquidityMining />
        case 'sisyphus':
            return <Sisyphus />
        case 'faucet':
            return <ScarcityFaucet />
        case 'governance':
            return <Governance />
        default:
            return <div>Chronos</div>
    }
}