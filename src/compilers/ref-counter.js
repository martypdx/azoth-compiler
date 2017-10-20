import { identifier } from '../transformers/common';

export default (ref = 0) => {
    return () => identifier(`__ref${ref++}`);
};