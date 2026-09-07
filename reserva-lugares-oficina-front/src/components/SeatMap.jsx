import {theme, Button, Space} from "antd";

// Un cuadrito de color + su etiqueta, para la leyenda de abajo del mapa.
function Leyenda({color, borderColor, texto}) {
    const cuadrito = (
        <span style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            borderRadius: 4,
            background: color,
            border: `1px solid ${borderColor}`,
        }} />
    );
    return <Space size={6}>{cuadrito}<span>{texto}</span></Space>;
}

function SeatMap({seats, mode, selectedSeatId, onSelectSeat}){
    const {token} = theme.useToken();

    return(
        <div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: token.marginSM
            }}>
                {seats.map(seat =>{
                    const isHighlighted = seat.id === selectedSeatId;
                    const isClickable = mode === 'select' && seat.status === 'disponible';

                    let styleTokens;

                    if (isHighlighted){
                        styleTokens = {background: token.colorInfoBg, borderColor: token.colorInfo, color: token.colorInfo};
                    } else if (seat.status === 'ocupado'){
                        styleTokens = { background: token.colorBgContainerDisabled, borderColor: token.colorBorderSecondary, color: token.colorTextDisabled};
                    } else {
                        styleTokens = { background: token.colorSuccessBg, borderColor: token.colorSuccessBorder, color: token.colorSuccess };
                    }
                    return (
                        <Button
                            key={seat.id}
                            disabled={!isClickable}
                            onClick={isClickable ? () => onSelectSeat(seat.id) : undefined}
                            style={{
                                gridRow: seat.row,
                                gridColumn: seat.column,
                                ...styleTokens,
                            }}
                        >
                            {seat.code}
                        </Button>
                    );
                })}
            </div>
            <Space size="large" style={{ marginTop: token.marginLG, flexWrap: 'wrap' }}>
                <Leyenda color={token.colorSuccessBg} borderColor={token.colorSuccessBorder} texto="Disponible" />
                <Leyenda color={token.colorBgContainerDisabled} borderColor={token.colorBorderSecondary} texto="Ocupado" />
                <Leyenda
                    color={token.colorInfoBg}
                    borderColor={token.colorInfo}
                    texto={mode === 'select' ? 'Seleccionado' : 'Tu lugar'}
                />
            </Space>
        </div>
    );
}
export default SeatMap;