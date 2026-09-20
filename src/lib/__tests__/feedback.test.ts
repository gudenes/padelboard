import {describe,it,expect} from 'vitest';
import {parseFeedback} from '../feedback';
describe('feedback',()=>{
 it('trims feedback and strips query tokens from page context',()=>{expect(parseFeedback({category:'idea',message:'  Add a bigger timer please  ',page_path:'/m/ABC?token=secret#live',user_id:'spoof'})).toEqual({category:'idea',message:'Add a bigger timer please',page_path:'/m/ABC'});});
 it.each([null,{}, {category:'bad',message:'A useful suggestion',page_path:'/'},{category:'idea',message:'short',page_path:'/'},{category:'idea',message:'x'.repeat(2001),page_path:'/'},{category:'idea',message:'A useful suggestion',page_path:'https://other.test'},{category:'idea',message:'A useful suggestion',page_path:'//other.test'}])('rejects invalid submissions',value=>{expect(()=>parseFeedback(value)).toThrow();});
});
