'use client';
import {useEffect} from 'react';
import {useMap} from 'react-leaflet';
export default function MapViewport({position}:{position:{lat:number;lng:number}}){
 const map=useMap();
 useEffect(()=>{map.setView([position.lat,position.lng],Math.max(map.getZoom(),14));},[map,position]);
 return null;
}
