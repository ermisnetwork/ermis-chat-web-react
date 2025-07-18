import {
  ArchiveMinusIcon,
  EditProfileIcon,
  LogoutIcon,
  MoreIcon,
  NewChatIcon,
  PeopleIcon,
  PhoneIcon,
  SmileChatIcon,
  UserOctagonIcon,
  UserSquareIcon,
} from '../components/Icons';

const Profile_Menu = [
  {
    title: 'Edit Profile',
    icon: <EditProfileIcon size={24} />,
    key: 'profile',
  },
  // {
  //   title: 'Saved Messages',
  //   icon: <ArchiveMinusIcon size={24} />,
  //   key: 'saved_messages',
  // },
  // {
  //   title: 'Blocked Contacts',
  //   icon: <UserOctagonIcon size={24} />,
  //   key: 'blocked_contacts',
  // },
  {
    title: 'Log Out',
    icon: <LogoutIcon size={24} />,
    key: 'logout',
  },
];

const Nav_Buttons = [
  {
    index: 0,
    icon: <SmileChatIcon size={30} />,
    title: 'Convertions',
  },
  // {
  //   index: 1,
  //   icon: <PhoneIcon size={30} />,
  //   title: 'Calls',
  // },
  {
    index: 2,
    icon: <UserSquareIcon size={30} />,
    title: 'Contacts',
  },
  // {
  //   index: 3,
  //   icon: <MoreIcon size={30} />,
  //   title: 'More',
  // },
];

const NewChat_Menu = [
  {
    title: 'New Channel',
    icon: <PeopleIcon size={24} />,
    key: 'new_channel',
  },
  {
    title: 'New Message',
    icon: <NewChatIcon size={24} />,
    key: 'new_message',
  },
];

export { Profile_Menu, Nav_Buttons, NewChat_Menu };
